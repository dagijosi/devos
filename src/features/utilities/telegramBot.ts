import { database } from '../../database';
import { loadTelegramConfig, saveTelegramConfig, normalizeChatFilter } from './telegramConfig';

const API = 'https://api.telegram.org/bot';
export const DEDUP_KEY = 'devos_telegram_processed_ids';
const LAST_CREATED_KEY = 'devos_telegram_last_created';

// ── Deduplication ──────────────────────────────────────────────────────────
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

// ── Send message ───────────────────────────────────────────────────────────
async function sendMsg(token: string, chatId: number, text: string, extra?: Record<string, unknown>) {
  const post = async (body: Record<string, unknown>) => {
    const res = await fetch(`${API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json().catch(() => ({ ok: false, description: 'Invalid response' }));
  };

  // Always try plain text first — Markdown often rejects bot replies silently.
  const { parse_mode: _pm, ...extraWithoutMode } = (extra ?? {}) as Record<string, unknown>;
  let data = await post({ chat_id: chatId, text, ...extraWithoutMode });
  if (!data.ok) {
    data = await post({ chat_id: chatId, text, parse_mode: 'Markdown', ...extraWithoutMode });
  }
  if (!data.ok) {
    throw new Error(data.description || 'sendMessage failed');
  }
}

// ── Last-created tracking (for /undo) ────────────────────────────────────
interface LastCreatedEntry { id: number; type: string; title: string }

function getLastCreated(chatId: number): LastCreatedEntry | null {
  try {
    const map: Record<string, LastCreatedEntry> = JSON.parse(localStorage.getItem(LAST_CREATED_KEY) || '{}');
    return map[String(chatId)] ?? null;
  } catch { return null; }
}
function setLastCreated(chatId: number, id: number, type: string, title: string) {
  try {
    const map: Record<string, LastCreatedEntry> = JSON.parse(localStorage.getItem(LAST_CREATED_KEY) || '{}');
    map[String(chatId)] = { id, type, title };
    localStorage.setItem(LAST_CREATED_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}
function removeLastCreated(chatId: number) {
  try {
    const map: Record<string, LastCreatedEntry> = JSON.parse(localStorage.getItem(LAST_CREATED_KEY) || '{}');
    delete map[String(chatId)];
    localStorage.setItem(LAST_CREATED_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}

// ── Helpers ────────────────────────────────────────────────────────────────
function extractTags(text: string): { clean: string; tags: string[] } {
  const tags: string[] = [];
  const clean = text.replace(/#(\w+)/g, (_, tag) => { tags.push(tag); return ''; }).trim();
  return { clean, tags };
}

function buildTags(...extra: string[]): string {
  return JSON.stringify([...new Set(['telegram', ...extra])]);
}

const today = () => new Date().toISOString().slice(0, 10);
const weekAgo = () => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); };
const weeksAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - 7 * n); return d.toISOString().slice(0, 10); };

const DB_ERROR = '⚠️ Database unavailable — try again in a moment.';

const STATUS_EMOJI: Record<string, string> = { active: '🟢', archived: '🔴', planning: '🟡' };

// ── Types ─────────────────────────────────────────────────────────────────
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

// ── Project resolution (@ProjectName syntax) ──────────────────────────────
async function resolveProject(text: string): Promise<{ text: string; projectId: number | null; projectName: string | null }> {
  const match = text.match(/@(\S+)/);
  if (!match) return { text, projectId: null, projectName: null };
  const name = match[1];
  const cleaned = text.replace(`@${name}`, '').trim();
  try {
    const projects = await database.getProjects();
    const p = projects.find(p => p.name.toLowerCase() === name.toLowerCase());
    return { text: cleaned, projectId: p?.id ?? null, projectName: p?.name ?? null };
  } catch {
    return { text: cleaned, projectId: null, projectName: null };
  }
}

// ── Find project by name OR numeric id ────────────────────────────────────
/** Accepts: "MyApp", "myapp", "3", "#3", "3 " */
async function findProject(arg: string): Promise<{ proj: any | null; byName: boolean }> {
  const clean = arg.trim().replace(/^#/, '');
  const numId = parseInt(clean, 10);
  try {
    const projs = await database.getProjects();
    if (!isNaN(numId)) {
      const p = projs.find(p => p.id === numId);
      return { proj: p ?? null, byName: false };
    }
    // Case-insensitive partial name match — prefer exact match first
    const exact = projs.find(p => p.name.toLowerCase() === clean.toLowerCase());
    if (exact) return { proj: exact, byName: true };
    const partial = projs.find(p => p.name.toLowerCase().includes(clean.toLowerCase()));
    return { proj: partial ?? null, byName: true };
  } catch {
    return { proj: null, byName: false };
  }
}

// ── Welcome message ────────────────────────────────────────────────────────
function plainWelcome(): string {
  return (
    'DevOS Bot 🤖\n\n' +
    'Send any text → saved as a note. Use #tags to categorize.\n\n' +
    'Create:\n' +
    '  📝 /note Title (body on next line)\n' +
    '  🐛 /bug Title (problem on next line)\n' +
    '  📋 /snippet Title (code on next line)\n' +
    '  ✅ /todo Task name\n\n' +
    'Browse:\n' +
    '  🔍 /search query\n' +
    '  📋 /list notes|bugs|snippets|all\n' +
    '  📋 /recent [type] — last 8 items\n\n' +
    'Projects:\n' +
    '  📁 /projects — list projects with IDs\n' +
    '  📁 /project <name or #id> — project details\n' +
    '  📋 /copy — copy project ID list\n\n' +
    'Stats:\n' +
    '  📊 /stats — full knowledge base stats\n' +
    '  📋 /today — today\'s activity summary\n' +
    '  📅 /weekly — this week vs last week\n\n' +
    'Manage:\n' +
    '  ↩️ /undo — delete last saved item\n' +
    '  🗑 /delete <id> — delete by ID\n' +
    '  📌 /pin <id> — toggle favorite\n' +
    '  🆔 /id — show this chat ID\n' +
    '  🔇 /mute · 🔊 /unmute — pause/resume polling\n' +
    '  ❓ /help — show this message\n\n' +
    'Tip: use @ProjectName to attach to a project. Use #tags to organize.'
  );
}

// ── Main update processor ─────────────────────────────────────────────────
export async function processTelegramUpdates(token: string, chatFilter: string, updates: any[]): Promise<ProcessedUpdate[]> {
  const results: ProcessedUpdate[] = [];
  let filter = normalizeChatFilter(chatFilter);

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
      entry.result =
        `Ignored — this chat is ${chatId}, but Chat ID filter is ${filter}. ` +
        `In DevOS → Telegram settings, clear Chat ID (or set it to ${chatId}), then send /start again.`;
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

    // Map emoji reply-keyboard buttons to their canonical slash commands.
    const EMOJI_CMD_MAP: Record<string, string> = {
      '📝 note': '/note',
      '🐛 bug': '/bug',
      '✅ todo': '/todo',
      '📋 snippet': '/snippet',
      '📊 stats': '/stats',
      '📁 projects': '/projects',
      '📋 list': '/list',
      '🔍 search': '/search',
      '↩️ undo': '/undo',
      '🔇 mute': '/mute',
      '🔊 unmute': '/unmute',
      '🆔 id': '/id',
    };
    const mappedCmd = EMOJI_CMD_MAP[text.trim().toLowerCase()];

    try {
      // First successful message (or any command with empty filter) locks this chat
      if (!filter) {
        const cfg = loadTelegramConfig();
        if (!normalizeChatFilter(cfg.chat_id)) {
          saveTelegramConfig({ ...cfg, chat_id: String(chatId) });
          filter = String(chatId);
        }
      }

      if (mappedCmd) {
        entry.command = mappedCmd.slice(1);
        entry.args = '';
        entry.body = '';
        await handleCommand(token, entry);
      } else if (cmd.startsWith('/')) {
        entry.command = cmd.slice(1);
        entry.args = cmdArgs;
        entry.body = rest;
        await handleCommand(token, entry);
      } else {
        const { text: cleanTitle, projectId, projectName } = await resolveProject(firstLine);
        entry.command = 'note';
        entry.args = cleanTitle;
        entry.body = rest;
        await saveNote(token, entry, cleanTitle, rest || cleanTitle, projectId, undefined, projectName);
      }
      markProcessed(msg.message_id);
    } catch (e: any) {
      entry.result = `Error: ${e?.message || e}`;
      try {
        await sendMsg(token, chatId, entry.result);
        markProcessed(msg.message_id);
      } catch {
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

// ── Reply keyboard ─────────────────────────────────────────────────────────
const REPLY_KEYBOARD = {
  keyboard: [
    [{ text: '📝 Note' }, { text: '🐛 Bug' }, { text: '✅ Todo' }, { text: '📋 Snippet' }],
    [{ text: '📊 Stats' }, { text: '📁 Projects' }, { text: '📋 List' }, { text: '🔍 Search' }],
    [{ text: '↩️ Undo' }, { text: '🔇 Mute' }, { text: '🔊 Unmute' }, { text: '🆔 ID' }],
  ],
  resize_keyboard: true,
  one_time_keyboard: false,
};

// ── Command handler ────────────────────────────────────────────────────────
async function handleCommand(token: string, entry: ProcessedUpdate) {
  const chatId = entry.chat_id;

  switch (entry.command) {
    case 'start':
      entry.result = plainWelcome();
      await sendMsg(token, chatId, entry.result, { reply_markup: REPLY_KEYBOARD });
      break;

    case 'note': {
      const { text: rawArgs, projectId, projectName } = await resolveProject(entry.args);
      const { clean: cleanArgs, tags } = extractTags(rawArgs);
      const userTags = buildTags(...tags);
      if (entry.body) {
        await saveNote(token, entry, cleanArgs, entry.body, projectId, userTags, projectName);
      } else if (cleanArgs) {
        await saveNote(token, entry, cleanArgs, cleanArgs, projectId, userTags, projectName);
      } else {
        entry.result = 'Send: /note Title\nthen your content on the next line.\n\nTip: add #tags to organize, @ProjectName to attach.';
        await sendMsg(token, chatId, entry.result);
      }
      break;
    }

    case 'bug': {
      const { text: rawTitle, projectId, projectName } = await resolveProject(entry.args);
      const { clean: cleanTitle, tags } = extractTags(rawTitle);
      const title = cleanTitle?.slice(0, 80) || 'Untitled Bug';
      const problem = entry.body || cleanTitle || '';
      try {
        const item = await database.createKnowledgeItem({
          type: 'bug', title, content: problem,
          tags: buildTags(...tags), status: 'open', project_id: projectId ?? null,
        });
        entry.created_id = item?.id;
        if (item?.id) setLastCreated(chatId, item.id, 'bug', title);
        entry.saved = true;
        entry.result =
          `🐛 Bug saved! #${item?.id}\n` +
          `Title: ${title}` +
          (projectName ? `\nProject: ${projectName}` : '') +
          (tags.length ? `\nTags: ${tags.map(t => `#${t}`).join(' ')}` : '');
      } catch {
        entry.result = DB_ERROR;
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'todo': {
      const raw = entry.args || entry.body || 'Untitled task';
      const { text: rawTask, projectId, projectName } = await resolveProject(raw);
      const { clean: cleanTask, tags } = extractTags(rawTask);
      const taskTitle = cleanTask.slice(0, 80);
      try {
        const item = await database.createKnowledgeItem({
          type: 'note', title: taskTitle, content: '',
          tags: buildTags('todo', ...tags), favorite: 0, project_id: projectId ?? null,
        });
        entry.created_id = item?.id;
        if (item?.id) setLastCreated(chatId, item.id, 'todo', taskTitle);
        entry.saved = true;
        entry.result =
          `✅ Task added! #${item?.id}\n` +
          `${taskTitle}` +
          (projectName ? `\nProject: ${projectName}` : '') +
          (tags.length ? `\nTags: ${tags.map(t => `#${t}`).join(' ')}` : '');
      } catch {
        entry.result = DB_ERROR;
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'snippet': {
      const { text: rawTitle, projectId, projectName } = await resolveProject(entry.args);
      const { clean: cleanTitle, tags } = extractTags(rawTitle);
      const title = cleanTitle?.slice(0, 80) || 'Untitled';
      const code = entry.body || '';
      if (!code) {
        entry.result = 'Send: /snippet Title\nthen your code on the next line.\n\nTip: add @ProjectName to attach.';
        await sendMsg(token, chatId, entry.result);
        break;
      }
      try {
        const item = await database.createKnowledgeItem({
          type: 'snippet', title, content: code,
          language: 'text', description: 'From Telegram',
          tags: buildTags(...tags), favorite: 0, project_id: projectId ?? null,
        });
        entry.created_id = item?.id;
        if (item?.id) setLastCreated(chatId, item.id, 'snippet', title);
        entry.saved = true;
        entry.result =
          `📋 Snippet saved! #${item?.id}\n` +
          `Title: ${title}` +
          (projectName ? `\nProject: ${projectName}` : '') +
          (tags.length ? `\nTags: ${tags.map(t => `#${t}`).join(' ')}` : '');
      } catch {
        entry.result = DB_ERROR;
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'search': {
      const query = entry.args || entry.body || '';
      if (!query) {
        entry.result = 'Usage: /search what you are looking for\n\nExample: /search caching bug';
        await sendMsg(token, chatId, entry.result);
        break;
      }
      try {
        const items = await database.searchKnowledge(query);
        entry.result = items?.length
          ? `🔍 "${query}" — ${items.length} result${items.length !== 1 ? 's' : ''}\n\n` +
            items.slice(0, 6).map(i => `• #${i.id} ${i.title} (${i.type})`).join('\n') +
            (items.length > 6 ? `\n\n… and ${items.length - 6} more` : '')
          : `No results for "${query}".`;
      } catch {
        entry.result = DB_ERROR;
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'project':
    case 'projects': {
      const arg = entry.args?.trim();

      // Listing mode — no args, or command is explicitly "projects"
      if (!arg || entry.command === 'projects' && !arg) {
        try {
          const projs = await database.getProjects();
          if (!projs?.length) {
            entry.result = 'No projects yet. Create one in DevOS.';
          } else {
            const lines = await Promise.all(projs.slice(0, 20).map(async p => {
              const bugs = await database.getBugsByProject(p.id);
              const open = bugs.filter((b: any) => b.status !== 'resolved' && b.status !== 'closed').length;
              const status = STATUS_EMOJI[p.status] || '⚪';
              return `${status} #${p.id}  ${p.name}${open > 0 ? `  (${open}🐛)` : ''}`;
            }));
            entry.result =
              `📁 Projects (${projs.length})\n` +
              `Use /project <name or #id> for details\n\n` +
              lines.join('\n');
          }
        } catch {
          entry.result = DB_ERROR;
        }
        await sendMsg(token, chatId, entry.result);
        break;
      }

      // Detail mode — arg is a name or ID
      try {
        const { proj } = await findProject(arg);
        if (!proj) {
          // Try listing to help the user
          const projs = await database.getProjects().catch(() => []);
          const hint = projs.length
            ? `\n\nAvailable projects:\n` + projs.slice(0, 10).map((p: any) => `• #${p.id} ${p.name}`).join('\n')
            : '';
          entry.result = `Project "${arg}" not found.${hint}`;
        } else {
          const [bugs, items] = await Promise.all([
            database.getBugsByProject(proj.id),
            database.getKnowledgeItems().then((all: any[]) =>
              all.filter(i => (i as any).project_id === proj.id)),
          ]);
          const openBugs = bugs.filter((b: any) => b.status !== 'resolved' && b.status !== 'closed').length;
          const resolvedBugs = bugs.filter((b: any) => b.status === 'resolved' || b.status === 'closed').length;
          const typeBreakdown = items.reduce((acc: Record<string, number>, i: any) => {
            acc[i.type] = (acc[i.type] || 0) + 1; return acc;
          }, {});
          const lastAct = proj.updated_at || proj.created_at;
          entry.result =
            `📁 ${proj.name}  (#${proj.id})\n\n` +
            `${STATUS_EMOJI[proj.status] || '⚪'} ${proj.status || 'active'}\n` +
            `🐛 Bugs: ${openBugs} open · ${resolvedBugs} resolved\n` +
            `📦 Items: ${items.length}` +
            (Object.keys(typeBreakdown).length
              ? ' (' + Object.entries(typeBreakdown).map(([t, n]) => `${n} ${t}${n !== 1 ? 's' : ''}`).join(', ') + ')'
              : '') + '\n' +
            `🕐 Updated: ${lastAct ? new Date(lastAct).toLocaleDateString() : 'N/A'}` +
            (proj.description ? `\n\n${proj.description}` : '');
        }
      } catch {
        entry.result = DB_ERROR;
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'copy': {
      // Send a clean project ID list for easy copy-pasting into /project commands
      try {
        const projs = await database.getProjects();
        if (!projs?.length) {
          entry.result = 'No projects yet. Create one in DevOS.';
        } else {
          entry.result =
            '📋 Project IDs\n\n' +
            projs.map((p: any) => `#${p.id}  ${p.name}`).join('\n') +
            '\n\nUse: /project <name or #id>';
        }
      } catch {
        entry.result = DB_ERROR;
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'stats':
      try {
        const allTypes = ['note', 'bug', 'snippet', 'prompt', 'doc', 'bookmark', 'template'] as const;
        const typeLabels: Record<string, string> = {
          note: '📝 Notes', bug: '🐛 Bugs', snippet: '📋 Snippets',
          prompt: '🤖 Prompts', doc: '📄 Docs', bookmark: '🔖 Bookmarks', template: '📋 Templates',
        };
        const counts = await Promise.all(allTypes.map(t => database.getKnowledgeItems(t).then(r => r.length)));
        const total = counts.reduce((s, c) => s + c, 0);
        const [projs, todayActs, weekActs] = await Promise.all([
          database.getProjects(),
          database.getActivityByRange(today(), today()),
          database.getActivityByRange(weekAgo(), today()),
        ]);
        const activeProjs = projs.filter(p => p.status === 'active' || !p.status).length;
        const archivedProjs = projs.filter(p => p.status === 'archived').length;
        const todayFocus = todayActs.reduce((s: number, a: any) => s + (a.duration || 0), 0);
        const weekFocus = weekActs.reduce((s: number, a: any) => s + (a.duration || 0), 0);
        const typeLines = allTypes.map((t, i) => `  ${typeLabels[t]}: ${counts[i]}`).join('\n');
        entry.result =
          `📊 DevOS Stats\n\n` +
          `📦 Knowledge Base (${total})\n${typeLines}\n\n` +
          `📁 Projects: ${activeProjs} active, ${archivedProjs} archived\n\n` +
          `⏱ Today: ${todayActs.length} events · ${Math.floor(todayFocus / 60)}h ${todayFocus % 60}m\n` +
          `📅 Week: ${Math.floor(weekFocus / 60)}h ${weekFocus % 60}m`;
      } catch {
        entry.result = DB_ERROR;
      }
      await sendMsg(token, chatId, entry.result);
      break;

    case 'today':
      try {
        const todayActs = await database.getActivityByRange(today(), today());
        const focus = todayActs.reduce((s: number, a: any) => s + (a.duration || 0), 0);
        const byType: Record<string, number> = {};
        const projectIds = new Set<number>();
        for (const a of todayActs) {
          byType[a.type] = (byType[a.type] || 0) + 1;
          if (a.project_id) projectIds.add(a.project_id);
        }
        const typeSummary = Object.entries(byType)
          .sort((a, b) => b[1] - a[1])
          .map(([t, n]) => `• ${t}: ${n}`).join('\n');
        entry.result =
          `📋 Today's Activity\n\n` +
          `⏱ Focus: ${Math.floor(focus / 60)}h ${focus % 60}m\n` +
          `📁 Projects worked: ${projectIds.size}\n` +
          `📦 Events: ${todayActs.length}\n\n` +
          (typeSummary || 'No activity yet today.');
      } catch {
        entry.result = DB_ERROR;
      }
      await sendMsg(token, chatId, entry.result);
      break;

    case 'weekly':
      try {
        const weekActs = await database.getActivityByRange(weekAgo(), today());
        const prevWeekActs = await database.getActivityByRange(weeksAgo(2), weekAgo());
        const focus = weekActs.reduce((s: number, a: any) => s + (a.duration || 0), 0);
        const prevFocus = prevWeekActs.reduce((s: number, a: any) => s + (a.duration || 0), 0);
        const byType: Record<string, number> = {};
        const projectIds = new Set<number>();
        for (const a of weekActs) {
          byType[a.type] = (byType[a.type] || 0) + 1;
          if (a.project_id) projectIds.add(a.project_id);
        }
        const typeSummary = Object.entries(byType)
          .sort((a, b) => b[1] - a[1])
          .map(([t, n]) => `• ${t}: ${n}`).join('\n');
        const focusChange = prevFocus > 0 ? Math.round(((focus - prevFocus) / prevFocus) * 100) : 0;
        const changeStr = focusChange !== 0
          ? `(${focusChange > 0 ? '+' : ''}${focusChange}% vs last week)`
          : '(same as last week)';
        entry.result =
          `📅 This Week\n\n` +
          `⏱ Focus: ${Math.floor(focus / 60)}h ${focus % 60}m ${changeStr}\n` +
          `📁 Projects: ${projectIds.size}\n` +
          `📦 Events: ${weekActs.length}\n\n` +
          (typeSummary || 'No activity this week.');
      } catch {
        entry.result = DB_ERROR;
      }
      await sendMsg(token, chatId, entry.result);
      break;

    case 'undo': {
      const last = getLastCreated(chatId);
      if (!last) {
        entry.result = 'Nothing to undo — no items were created from this chat yet.';
        await sendMsg(token, chatId, entry.result);
        break;
      }
      try {
        await database.deleteKnowledgeItem(last.id);
        removeLastCreated(chatId);
        entry.result = `↩️ Deleted: ${last.type} #${last.id} "${last.title}"`;
      } catch {
        entry.result = `Failed to delete — item may have already been removed.\n(${last.type} #${last.id} "${last.title}")`;
        removeLastCreated(chatId);
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'list': {
      const raw = entry.args?.toLowerCase().trim();
      const typeMap: Record<string, string> = {
        notes: 'note', bugs: 'bug', snippets: 'snippet', prompts: 'prompt',
        docs: 'doc', bookmarks: 'bookmark', templates: 'template',
        note: 'note', bug: 'bug', snippet: 'snippet', prompt: 'prompt',
        doc: 'doc', bookmark: 'bookmark', template: 'template',
      };
      const typeLabels: Record<string, string> = {
        note: 'Notes', bug: 'Bugs', snippet: 'Snippets', prompt: 'Prompts',
        doc: 'Docs', bookmark: 'Bookmarks', template: 'Templates',
      };
      if (!raw || (raw !== 'all' && !typeMap[raw])) {
        entry.result = 'Usage: /list notes|bugs|snippets|prompts|docs|bookmarks|templates|all\n\nShows up to 10 items with their IDs.';
        await sendMsg(token, chatId, entry.result);
        break;
      }
      try {
        let items: any[];
        let label: string;
        if (raw === 'all') {
          items = await database.getKnowledgeItems();
          label = 'All Items';
        } else {
          items = await database.getKnowledgeItems(typeMap[raw]);
          label = typeLabels[typeMap[raw]];
        }
        const lines = items.slice(0, 10).map(i =>
          `• #${i.id}  ${i.title || 'Untitled'}${raw === 'all' ? ` (${i.type})` : ''}`
        ).join('\n');
        entry.result = items.length
          ? `📋 ${label} (${items.length} total)\n\n${lines}` +
            (items.length > 10 ? `\n\n… and ${items.length - 10} more` : '') +
            `\n\nUse /pin <id> or /delete <id>`
          : `No ${label.toLowerCase()} yet.`;
      } catch {
        entry.result = DB_ERROR;
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'delete': {
      const id = parseInt(entry.args, 10);
      if (!id) {
        entry.result = 'Usage: /delete <item ID>\n\nExample: /delete 42\nUse /list or /search to find IDs.';
        await sendMsg(token, chatId, entry.result);
        break;
      }
      try {
        // Try to get title before deleting
        let title = '';
        try {
          const all = await database.getKnowledgeItems();
          const item = all.find((i: any) => i.id === id);
          title = item?.title ? ` "${item.title}"` : '';
        } catch { /* non-critical */ }
        await database.deleteKnowledgeItem(id);
        removeLastCreated(chatId);
        entry.result = `🗑 Deleted #${id}${title}.`;
      } catch {
        entry.result = `Could not delete #${id} — it may not exist.\nUse /list to check.`;
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'pin': {
      const id = parseInt(entry.args, 10);
      if (!id) {
        entry.result = 'Usage: /pin <item ID>\n\nExample: /pin 42\nUse /list or /search to find IDs.';
        await sendMsg(token, chatId, entry.result);
        break;
      }
      try {
        let title = '';
        try {
          const all = await database.getKnowledgeItems();
          const item = all.find((i: any) => i.id === id);
          title = item?.title ? ` "${item.title}"` : '';
        } catch { /* non-critical */ }
        await database.toggleKnowledgeFavorite(id);
        entry.result = `📌 Toggled favorite on #${id}${title}.`;
      } catch {
        entry.result = `Could not toggle favorite on #${id} — it may not exist.\nUse /list to check.`;
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'id':
      entry.result = `🆔 This chat ID: ${chatId}\n\nPaste this into DevOS → Telegram → Chat ID field to lock the bot to this chat.`;
      await sendMsg(token, chatId, entry.result);
      break;

    case 'mute': {
      const cfg = loadTelegramConfig();
      saveTelegramConfig({ ...cfg, auto_poll: false });
      entry.result = '🔇 Polling paused. Send /unmute to resume.';
      await sendMsg(token, chatId, entry.result);
      try { window.dispatchEvent(new CustomEvent('telegram-config')); } catch {}
      break;
    }

    case 'unmute': {
      const cfg = loadTelegramConfig();
      saveTelegramConfig({ ...cfg, auto_poll: true });
      entry.result = '🔊 Polling resumed.';
      await sendMsg(token, chatId, entry.result);
      try { window.dispatchEvent(new CustomEvent('telegram-config')); } catch {}
      break;
    }

    case 'recent': {
      const typeFilter = entry.args?.toLowerCase().trim();
      const validTypes = ['note', 'bug', 'snippet', 'prompt', 'doc', 'bookmark', 'template'];
      const normalizeType = (t: string) =>
        validTypes.includes(t) ? t : validTypes.find(v => `${v}s` === t || `${v}es` === t) ?? undefined;
      const filterType = typeFilter ? normalizeType(typeFilter) : undefined;
      try {
        const items = await database.getKnowledgeItems(filterType);
        const header = filterType ? `Recent ${filterType}s` : 'Recent items';
        entry.result = items?.length
          ? `📋 ${header} (${items.length} total)\n\n` +
            items.slice(0, 8).map(i => `• #${i.id}  ${i.title}${filterType ? '' : ` — ${i.type}`}`).join('\n') +
            `\n\nUse /pin <id> or /delete <id>`
          : `No ${filterType ? filterType + 's' : 'items'} yet.`;
      } catch {
        entry.result = DB_ERROR;
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'help':
    default:
      entry.result = plainWelcome();
      await sendMsg(token, chatId, entry.result, { reply_markup: REPLY_KEYBOARD });
      break;
  }
}

// ── Save note helper ───────────────────────────────────────────────────────
async function saveNote(
  token: string, entry: ProcessedUpdate, title: string, content: string,
  projectId?: number | null, tagsJson?: string, projectName?: string | null,
) {
  const parsedTags: string[] = tagsJson ? JSON.parse(tagsJson).filter((t: string) => t !== 'telegram') : [];
  const item = await database.createKnowledgeItem({
    type: 'note', title: title.slice(0, 80), content,
    tags: tagsJson || '["telegram"]', favorite: 0, project_id: projectId ?? null,
  });
  entry.created_id = item?.id;
  if (item?.id) setLastCreated(entry.chat_id, item.id, 'note', title.slice(0, 80));
  entry.saved = true;
  entry.result =
    `📝 Note saved! #${item?.id}\n` +
    `Title: ${title.slice(0, 80)}` +
    (projectName ? `\nProject: ${projectName}` : '') +
    (parsedTags.length ? `\nTags: ${parsedTags.map(t => `#${t}`).join(' ')}` : '');
  await sendMsg(token, entry.chat_id, entry.result);
}

// ── Register bot commands ──────────────────────────────────────────────────
export async function setBotCommands(token: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          { command: 'start', description: 'Welcome & command list' },
          { command: 'note', description: 'Save a note (title + body on next line)' },
          { command: 'bug', description: 'Report a bug (title + problem on next line)' },
          { command: 'todo', description: 'Add a task' },
          { command: 'snippet', description: 'Save a code snippet (title + code on next line)' },
          { command: 'search', description: 'Search your knowledge base' },
          { command: 'list', description: 'List items by type: notes, bugs, snippets, all' },
          { command: 'today', description: "Today's activity summary" },
          { command: 'weekly', description: 'This week\'s stats vs last week' },
          { command: 'projects', description: 'List all projects with their IDs' },
          { command: 'project', description: 'Project details — /project <name or #id>' },
          { command: 'copy', description: 'Copy project ID list' },
          { command: 'stats', description: 'Full knowledge base stats' },
          { command: 'undo', description: 'Delete the last item created from Telegram' },
          { command: 'delete', description: 'Delete an item: /delete <id>' },
          { command: 'pin', description: 'Toggle favorite: /pin <id>' },
          { command: 'id', description: 'Show this chat ID' },
          { command: 'mute', description: 'Pause polling' },
          { command: 'unmute', description: 'Resume polling' },
          { command: 'recent', description: 'Show recent items with IDs' },
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
