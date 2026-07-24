import { database } from '../../database';

const API = 'https://api.telegram.org/bot';
const DEDUP_KEY = 'devos_telegram_processed_ids';

function getProcessed(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(DEDUP_KEY) || '[]')); }
  catch { return new Set(); }
}
function markProcessed(id: number) {
  const set = getProcessed();
  set.add(id);
  const arr = [...set];
  if (arr.length > 1000) arr.splice(0, arr.length - 1000);
  localStorage.setItem(DEDUP_KEY, JSON.stringify(arr));
}
function unmarkProcessed(id: number) {
  const set = getProcessed();
  set.delete(id);
  localStorage.setItem(DEDUP_KEY, JSON.stringify([...set]));
}

/** In-flight locks so concurrent polls don't double-send before markProcessed. */
const inFlight = new Set<number>();

async function sendMsg(token: string, chatId: number, text: string) {
  const post = async (body: Record<string, unknown>) => {
    const res = await fetch(`${API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json().catch(() => ({ ok: false, description: 'Invalid response' }));
  };

  // Prefer plain text — Legacy Markdown often rejects bot replies silently.
  let data = await post({ chat_id: chatId, text });
  if (!data.ok) {
    data = await post({ chat_id: chatId, text, parse_mode: 'Markdown' });
  }
  if (!data.ok) {
    throw new Error(data.description || 'sendMessage failed');
  }
}

export interface ProcessedUpdate {
  update_id: number;
  message_id: number;
  chat_id: number;
  text: string;
  command: string;
  args: string;
  body: string;
  result: string;
  created_id?: number;
  saved: boolean;
  skipped?: boolean;
}

async function resolveProject(text: string): Promise<{ text: string; projectId: number | null }> {
  const match = text.match(/@(\S+)/);
  if (!match) return { text, projectId: null };
  const name = match[1];
  const cleaned = text.replace(`@${name}`, '').trim();
  try {
    const projects = await database.getProjects();
    const p = projects.find(p => p.name.toLowerCase() === name.toLowerCase());
    return { text: cleaned, projectId: p?.id ?? null };
  } catch {
    return { text: cleaned, projectId: null };
  }
}

function plainWelcome(): string {
  return (
    'DevOS Bot\n\n' +
    'I connect Telegram to your DevOS dashboard.\n\n' +
    'Commands:\n' +
    '• Send any text → saves as a note\n' +
    '• /note Title  (body on next lines)\n' +
    '• /bug Title  (problem on next lines)\n' +
    '• /snippet Title  (code on next lines)\n' +
    '• /todo Task name\n' +
    '• /search query\n' +
    '• /recent\n' +
    '• /help\n\n' +
    'Tip: add @ProjectName to link an item to a project.'
  );
}

export async function processTelegramUpdates(token: string, chatFilter: string, updates: any[]): Promise<ProcessedUpdate[]> {
  const results: ProcessedUpdate[] = [];
  const filter = (chatFilter || '').trim();

  for (const update of updates) {
    const msg = update.message;
    if (!msg?.text) continue;

    const chatId = msg.chat.id;
    const text = String(msg.text).trim();

    const entry: ProcessedUpdate = {
      update_id: update.update_id,
      message_id: msg.message_id,
      chat_id: chatId,
      text,
      command: '',
      args: '',
      body: '',
      result: '',
      saved: false,
    };

    if (filter && String(chatId) !== filter) {
      entry.skipped = true;
      entry.command = 'skipped';
      entry.result = `Ignored — chat ${chatId} does not match filter ${filter}. Clear Chat ID in Telegram settings.`;
      results.push(entry);
      continue;
    }

    if (getProcessed().has(msg.message_id) || inFlight.has(msg.message_id)) {
      entry.skipped = true;
      entry.command = 'skipped';
      entry.result = 'Already handled (or still processing).';
      results.push(entry);
      continue;
    }

    inFlight.add(msg.message_id);

    const firstLine = text.split('\n')[0];
    const rest = text.slice(firstLine.length).trim();
    const parts = firstLine.split(/\s+/);
    const rawCmd = parts[0].toLowerCase();
    const cmd = rawCmd.startsWith('/') ? rawCmd.split('@')[0] : rawCmd;
    const cmdArgs = parts.slice(1).join(' ');

    try {
      if (cmd.startsWith('/')) {
        entry.command = cmd.slice(1);
        entry.args = cmdArgs;
        entry.body = rest;
        await handleCommand(token, entry);
      } else {
        const { text: cleanTitle, projectId } = await resolveProject(firstLine);
        entry.command = 'note';
        entry.args = cleanTitle;
        entry.body = rest;
        await saveNote(token, entry, cleanTitle, rest || cleanTitle, projectId);
      }
      markProcessed(msg.message_id);
    } catch (e: any) {
      entry.result = `Error: ${e?.message || e}`;
      try {
        await sendMsg(token, chatId, entry.result);
        markProcessed(msg.message_id);
      } catch {
        // Leave unmarked so the next poll can retry
        unmarkProcessed(msg.message_id);
      }
    } finally {
      inFlight.delete(msg.message_id);
    }

    results.push(entry);
  }

  if (results.some(r => r.saved)) {
    try { window.dispatchEvent(new CustomEvent('knowledge-updated')); } catch {}
  }

  return results;
}

async function handleCommand(token: string, entry: ProcessedUpdate) {
  const chatId = entry.chat_id;

  switch (entry.command) {
    case 'start':
      entry.result = plainWelcome();
      await sendMsg(token, chatId, entry.result);
      break;

    case 'note': {
      const { text: cleanArgs, projectId } = await resolveProject(entry.args);
      if (entry.body) {
        await saveNote(token, entry, cleanArgs, entry.body, projectId);
      } else if (cleanArgs) {
        await saveNote(token, entry, cleanArgs, cleanArgs, projectId);
      } else {
        entry.result = 'Send: /note Title then your content on the next line.';
        await sendMsg(token, chatId, entry.result);
      }
      break;
    }

    case 'bug': {
      const { text: cleanTitle, projectId } = await resolveProject(entry.args);
      const title = cleanTitle?.slice(0, 80) || 'Untitled Bug';
      const problem = entry.body || cleanTitle || '';
      try {
        await database.createKnowledgeItem({ type: 'bug', title, content: problem, tags: '["telegram"]', status: 'open', project_id: projectId ?? null });
        entry.saved = true;
        entry.result = `Bug saved!\n${title}`;
      } catch (e: any) {
        entry.result = `Failed: ${e.message}`;
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'todo': {
      const raw = entry.args || entry.body || 'Untitled task';
      const { text: cleanTask, projectId } = await resolveProject(raw);
      const taskTitle = cleanTask.slice(0, 80);
      try {
        const item = await database.createKnowledgeItem({ type: 'note', title: taskTitle, content: '', tags: '["telegram","todo"]', favorite: 0, project_id: projectId ?? null });
        entry.created_id = item?.id;
        entry.saved = true;
        entry.result = `Task added!\n${taskTitle}`;
      } catch (e: any) {
        entry.result = `Failed: ${e.message}`;
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'snippet': {
      const { text: cleanTitle, projectId } = await resolveProject(entry.args);
      const title = cleanTitle?.slice(0, 80) || 'Untitled';
      const code = entry.body || '';
      if (!code) {
        entry.result = 'Send: /snippet Title then your code on the next line.';
        await sendMsg(token, chatId, entry.result);
        break;
      }
      try {
        await database.createKnowledgeItem({ type: 'snippet', title, content: code, language: 'text', description: 'From Telegram', tags: '["telegram"]', favorite: 0, project_id: projectId ?? null });
        entry.saved = true;
        entry.result = `Snippet saved!\n${title}`;
      } catch (e: any) {
        entry.result = `Failed: ${e.message}`;
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'search': {
      const query = entry.args || entry.body || '';
      if (!query) {
        entry.result = 'Usage: /search what you are looking for';
        await sendMsg(token, chatId, entry.result);
        break;
      }
      try {
        const items = await database.searchKnowledge(query);
        entry.result = items?.length
          ? `Results for: ${query}\n\n` + items.slice(0, 5).map(i => `• ${i.title} (${i.type}) — ID: ${i.id}`).join('\n')
          : 'No results found.';
      } catch {
        entry.result = 'Search unavailable.';
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'recent':
      try {
        const items = await database.getKnowledgeItems();
        entry.result = items?.length
          ? `Recent items\n\n` + items.slice(0, 8).map(i => `• ${i.title} — ${i.type} (ID: ${i.id})`).join('\n')
          : 'No items yet.';
      } catch {
        entry.result = 'Unable to load recent items.';
      }
      await sendMsg(token, chatId, entry.result);
      break;

    case 'help':
    default:
      entry.result = plainWelcome();
      await sendMsg(token, chatId, entry.result);
      break;
  }
}

async function saveNote(token: string, entry: ProcessedUpdate, title: string, content: string, projectId?: number | null) {
  const item = await database.createKnowledgeItem({ type: 'note', title: title.slice(0, 80), content, tags: '["telegram"]', favorite: 0, project_id: projectId ?? null });
  entry.created_id = item?.id;
  entry.saved = true;
  entry.result = `Note saved!\nID: ${item?.id}\nTitle: ${title.slice(0, 80)}`;
  await sendMsg(token, entry.chat_id, entry.result);
}

export async function setBotCommands(token: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          { command: 'start', description: 'Welcome & available commands' },
          { command: 'note', description: 'Save a note (title + body on next line)' },
          { command: 'bug', description: 'Report a bug (title + problem on next line)' },
          { command: 'todo', description: 'Add a task' },
          { command: 'snippet', description: 'Save a code snippet (title + code on next line)' },
          { command: 'search', description: 'Search your knowledge base' },
          { command: 'recent', description: 'Show recent items' },
          { command: 'help', description: 'Show all commands' },
        ],
      }),
    });
    const data = await res.json();
    return data.ok;
  } catch { return false; }
}

/** Clear dedup so Telegram messages can be retried after a failed reply. */
export function clearTelegramDedup() {
  localStorage.removeItem(DEDUP_KEY);
  inFlight.clear();
}
