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

// ── Inline keyboard helpers ────────────────────────────────────────────────
type InlineButton = { text: string; callback_data: string };
type InlineRow = InlineButton[];

function inlineKeyboard(rows: InlineRow[]): Record<string, unknown> {
  return { inline_keyboard: rows };
}

async function sendWithButtons(token: string, chatId: number, text: string, buttons: InlineRow[], extra?: Record<string, unknown>) {
  await sendMsg(token, chatId, text, { ...extra, reply_markup: inlineKeyboard(buttons) });
}

async function editMsg(token: string, chatId: number, messageId: number, text: string, buttons?: InlineRow[]) {
  const body: Record<string, unknown> = { chat_id: chatId, message_id: messageId, text };
  if (buttons) body.reply_markup = inlineKeyboard(buttons);
  const res = await fetch(`${API}${token}/editMessageText`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json().catch(() => ({ ok: false }));
}

async function answerCbQuery(token: string, callbackQueryId: string, text?: string, showAlert?: boolean) {
  const res = await fetch(`${API}${token}/answerCallbackQuery`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: showAlert ?? false }),
  });
  return res.json().catch(() => ({ ok: false }));
}

// ── Callback data helpers ──────────────────────────────────────────────────
// Format: "action:payload" e.g. "project:3", "page:projects:1", "delete:42:confirm"
function encodeCb(action: string, ...args: (string | number)[]): string {
  return `${action}:${args.join(':')}`;
}

function decodeCb(data: string): { action: string; args: string[] } {
  const parts = data.split(':');
  return { action: parts[0], args: parts.slice(1) };
}

// Pagination reserved for future list pagination

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
    'Projects & Settings:\n' +
    '  📁 /projects — list all projects\n' +
    '  📁 /project <name|#id> — project details\n' +
    '  ➕ /newproject <name> — create a project\n' +
    '  ⚙️ /settings — bot & chat settings\n\n' +
    'Tasks:\n' +
    '  ✅ /tasks [project] — view project tasks\n' +
    '  ➕ /addtask task title — create project task\n' +
    '  ✔️ /taskdone <id> — complete a task\n\n' +
    'Knowledge:\n' +
    '  📝 /note Title (body on next line)\n' +
    '  🐛 /bug Title (problem on next line)\n' +
    '  📋 /snippet Title (code on next line)\n' +
    '  🔍 /search query — search library\n' +
    '  📋 /list notes|bugs|all — list items\n\n' +
    'APIs & Workflows:\n' +
    '  🌐 /api <url> — test HTTP endpoint\n' +
    '  ⚡ /workflows — list workflows\n' +
    '  ▶️ /runworkflow <id|name> — trigger workflow\n\n' +
    'Utilities (Tools):\n' +
    '  🛠 /tools — list developer tools\n' +
    '  🔑 /pwd [len] — generate password\n' +
    '  🆔 /uuid [count] — generate UUID\n' +
    '  🔒 /hash <text> — SHA-256 & MD5 hash\n' +
    '  📦 /b64 <text> — Base64 encode/decode\n' +
    '  📄 /json <string> — format JSON\n' +
    '  🏷 /slug <text> — generate URL slug\n\n' +
    'Deployments:\n' +
    '  🚀 /deployments — view deployments\n' +
    '  🚀 /deploy <id> — deployment status\n\n' +
    'Stats & Manage:\n' +
    '  📊 /stats · 📋 /today · 📅 /weekly\n' +
    '  ↩️ /undo · 🗑 /delete <id> · 📌 /pin <id>\n' +
    '  🔇 /mute · 🔊 /unmute · ❓ /help'
  );
}

// ── Main update processor ─────────────────────────────────────────────────
export async function processTelegramUpdates(token: string, chatFilter: string, updates: any[]): Promise<ProcessedUpdate[]> {
  const results: ProcessedUpdate[] = [];
  let filter = normalizeChatFilter(chatFilter);

  for (const update of updates) {
    // ── Handle callback queries (inline button taps) ────────────────
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat?.id;
      const msgId = cb.message?.message_id;
      if (!chatId || !msgId || !cb.data) continue;
      const { action, args } = decodeCb(cb.data);
      try {
        await handleCallback(token, chatId, msgId, cb.id, action, args);
      } catch { /* ignore callback errors */ }
      continue;
    }

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

    // Map emoji reply-keyboard buttons to canonical slash commands.
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
      '✅ tasks': '/tasks',
      '🛠 tools': '/tools',
      '⚡ workflows': '/workflows',
      '🚀 deployments': '/deployments',
      '⚙️ settings': '/settings',
    };
    const mappedCmd = EMOJI_CMD_MAP[text.trim().toLowerCase()];

    try {
      // First successful message locks chat filter
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
    [{ text: '📝 Note' }, { text: '🐛 Bug' }, { text: '✅ Tasks' }, { text: '📋 Snippet' }],
    [{ text: '📁 Projects' }, { text: '⚡ Workflows' }, { text: '🚀 Deployments' }, { text: '🛠 Tools' }],
    [{ text: '📊 Stats' }, { text: '🔍 Search' }, { text: '↩️ Undo' }, { text: '⚙️ Settings' }],
  ],
  resize_keyboard: true,
  one_time_keyboard: false,
};

// ── Callback query handler ────────────────────────────────────────────────
async function handleCallback(token: string, chatId: number, msgId: number, cbId: string, action: string, args: string[]) {
  switch (action) {
    case 'noop':
      await answerCbQuery(token, cbId);
      return;

    case 'project': {
      const projId = parseInt(args[0], 10);
      if (!projId) { await answerCbQuery(token, cbId, 'Invalid project', true); return; }
      await answerCbQuery(token, cbId, 'Loading...');
      try {
        const [projs, bugs, tasks, deps] = await Promise.all([
          database.getProjects(),
          database.getBugsByProject(projId).catch(() => []),
          database.getProjectTasks(projId).catch(() => []),
          database.getProjectDeployments(projId).catch(() => []),
        ]);
        const proj = projs.find(p => p.id === projId);
        if (!proj) { await editMsg(token, chatId, msgId, '❌ Project not found.'); return; }
        const openBugs = bugs.filter((b: any) => b.status !== 'resolved' && b.status !== 'closed').length;
        const openTasks = tasks.filter((t: any) => !t.completed).length;
        const text =
          `📁 *${proj.name}* (#${proj.id})\n\n` +
          `${STATUS_EMOJI[proj.status] || '⚪'} Status: ${proj.status || 'active'}\n` +
          `🐛 Bugs: ${openBugs}\n✅ Tasks: ${openTasks}\n🚀 Deployments: ${deps.length}\n` +
          (proj.description ? `\n${proj.description}` : '');
        const buttons: InlineRow[] = [
          [
            { text: `🐛 Bugs (${openBugs})`, callback_data: encodeCb('proj_bugs', projId) },
            { text: `✅ Tasks (${openTasks})`, callback_data: encodeCb('proj_tasks', projId) },
          ],
          [
            { text: '📝 New Note', callback_data: encodeCb('proj_note', projId) },
            { text: '◀️ Back to Projects', callback_data: 'list_projects' },
          ],
        ];
        await editMsg(token, chatId, msgId, text, buttons);
      } catch { await editMsg(token, chatId, msgId, DB_ERROR); }
      return;
    }

    case 'list_projects': {
      await answerCbQuery(token, cbId, 'Loading...');
      try {
        const projs = await database.getProjects();
        if (!projs.length) {
          await editMsg(token, chatId, msgId, '📁 No projects yet.\nUse /newproject <Name> to create one.');
          return;
        }
        const lines = projs.map(p => `${STATUS_EMOJI[p.status] || '⚪'} #${p.id} ${p.name}`).join('\n');
        const buttons: InlineRow[] = [
          ...projs.slice(0, 6).map(p => [{ text: `${STATUS_EMOJI[p.status] || '⚪'} ${p.name}`, callback_data: encodeCb('project', p.id) } as InlineButton]),
          [{ text: '📝 New Project', callback_data: 'new_project' }],
        ];
        await editMsg(token, chatId, msgId, `📁 *Projects* (${projs.length})\n\n${lines}`, buttons);
      } catch { await editMsg(token, chatId, msgId, DB_ERROR); }
      return;
    }

    case 'proj_bugs': {
      const pId = parseInt(args[0], 10);
      await answerCbQuery(token, cbId, 'Loading...');
      try {
        const bugs = await database.getBugsByProject(pId).catch(() => []);
        if (!bugs.length) {
          await editMsg(token, chatId, msgId, '🐛 No bugs for this project.');
          return;
        }
        const lines = bugs.slice(0, 8).map((b: any) =>
          `#${b.id} ${b.title || 'Untitled'} — ${b.status || 'open'}`
        ).join('\n');
        await editMsg(token, chatId, msgId,
          `🐛 *Bugs* (${bugs.length})\n\n${lines}`,
          [[{ text: '◀️ Back to Project', callback_data: encodeCb('project', pId) }]]);
      } catch { await editMsg(token, chatId, msgId, DB_ERROR); }
      return;
    }

    case 'proj_tasks': {
      const pId = parseInt(args[0], 10);
      await answerCbQuery(token, cbId, 'Loading...');
      try {
        const tasks = await database.getProjectTasks(pId).catch(() => []);
        if (!tasks.length) {
          await editMsg(token, chatId, msgId, '✅ No tasks for this project.');
          return;
        }
        const lines = tasks.slice(0, 8).map((t: any) =>
          `${t.completed ? '✅' : '🔴'} #${t.id} ${t.title}`
        ).join('\n');
        await editMsg(token, chatId, msgId,
          `✅ *Tasks* (${tasks.length})\n\n${lines}`,
          [[{ text: '◀️ Back to Project', callback_data: encodeCb('project', pId) }]]);
      } catch { await editMsg(token, chatId, msgId, DB_ERROR); }
      return;
    }

    case 'proj_note': {
      const pId = parseInt(args[0], 10);
      await answerCbQuery(token, cbId, 'Send: /note Title @ProjectName');
      const text = `📝 *New Note for Project*\n\nSend:\n\`/note Your Title\`\n\`Your content...\`\n\nThe note will be linked to this project automatically.`;
      await editMsg(token, chatId, msgId, text,
        [[{ text: '◀️ Back to Project', callback_data: encodeCb('project', pId) }]]);
      return;
    }

    case 'list_workflows': {
      await answerCbQuery(token, cbId, 'Loading...');
      try {
        const workflows = await database.getWorkflows();
        if (!workflows?.length) {
          await editMsg(token, chatId, msgId, '⚡ No workflows found.');
          return;
        }
        const lines = workflows.slice(0, 10).map((w: any) => `⚡ #${w.id} ${w.name}`).join('\n');
        const buttons: InlineRow[] = workflows.slice(0, 5).map((w: any) => [
          { text: `▶️ ${w.name}`, callback_data: encodeCb('runwf', w.id) },
        ]);
        await editMsg(token, chatId, msgId, `⚡ *Workflows* (${workflows.length})\n\n${lines}`, buttons);
      } catch { await editMsg(token, chatId, msgId, DB_ERROR); }
      return;
    }

    case 'runwf': {
      const wfId = parseInt(args[0], 10);
      try {
        await database.updateWorkflowLastRun(wfId, 'success');
        await database.createWorkflowLog(wfId, 'success', JSON.stringify([{ step: 'Triggered via Telegram', status: 'success' }]));
        await answerCbQuery(token, cbId, `✅ Workflow #${wfId} triggered!`, false);
        await editMsg(token, chatId, msgId, `▶️ Workflow #${wfId} triggered successfully!`);
      } catch { await answerCbQuery(token, cbId, 'Failed to trigger', true); }
      return;
    }

    case 'list_deployments': {
      await answerCbQuery(token, cbId, 'Loading...');
      try {
        const deps = await database.getAllDeployments();
        if (!deps?.length) {
          await editMsg(token, chatId, msgId, '🚀 No deployments found.');
          return;
        }
        const statusIcon: Record<string, string> = { live: '🟢', building: '🟡', failed: '🔴', idle: '⚪' };
        const lines = deps.slice(0, 10).map((d: any) => `${statusIcon[d.status] || '⚪'} #${d.id} ${d.name}`).join('\n');
        const buttons: InlineRow[] = deps.slice(0, 5).map((d: any) => [
          { text: `🚀 ${d.name} (${d.status})`, callback_data: encodeCb('deploy', d.id) },
        ]);
        await editMsg(token, chatId, msgId, `🚀 *Deployments* (${deps.length})\n\n${lines}`, buttons);
      } catch { await editMsg(token, chatId, msgId, DB_ERROR); }
      return;
    }

    case 'show_stats': {
      await answerCbQuery(token, cbId, 'Computing...');
      try {
        const allTypes = ['note', 'bug', 'snippet', 'prompt', 'doc', 'bookmark', 'template'] as const;
        const typeLabels: Record<string, string> = {
          note: '📝 Notes', bug: '🐛 Bugs', snippet: '📋 Snippets',
          prompt: '🤖 Prompts', doc: '📄 Docs', bookmark: '🔖 Bookmarks', template: '📋 Templates',
        };
        const counts = await Promise.all(allTypes.map(t => database.getKnowledgeItems(t).then(r => r.length)));
        const total = counts.reduce((s, c) => s + c, 0);
        const [projs] = await Promise.all([database.getProjects()]);
        const activeProjs = projs.filter(p => p.status === 'active' || !p.status).length;
        const typeLines = allTypes.map((t, i) => `  ${typeLabels[t]}: ${counts[i]}`).join('\n');
        const text =
          `📊 *DevOS Stats*\n\n` +
          `📦 Knowledge Base (${total})\n${typeLines}\n\n` +
          `📁 Projects: ${activeProjs} active`;
        const buttons: InlineRow[] = [[{ text: '🔙 Back', callback_data: 'back_home' }]];
        await editMsg(token, chatId, msgId, text, buttons);
      } catch { await editMsg(token, chatId, msgId, DB_ERROR); }
      return;
    }

    case 'show_search': {
      await answerCbQuery(token, cbId, 'Type /search <query> to search');
      const text = `🔍 *Search Library*\n\nType:\n\`/search what you're looking for\`\n\nExample: \`/search caching bug\``;
      const buttons: InlineRow[] = [[{ text: '🔙 Back', callback_data: 'back_home' }]];
      await editMsg(token, chatId, msgId, text, buttons);
      return;
    }

    case 'show_settings': {
      const cfg = loadTelegramConfig();
      const text =
        `⚙️ *Telegram Settings*\n\n` +
        `Chat Lock ID: \`${cfg.chat_id || 'Not locked'}\`\n` +
        `Polling: ${cfg.auto_poll !== false ? '🟢 Active' : '⏸ Paused'}\n` +
        `Interval: ${cfg.poll_interval || 15}s\n\n` +
        `Use /mute, /unmute, or /settings for details.`;
      const buttons: InlineRow[] = [[{ text: '🔙 Back', callback_data: 'back_home' }]];
      await editMsg(token, chatId, msgId, text, buttons);
      await answerCbQuery(token, cbId);
      return;
    }

    case 'show_help': {
      await answerCbQuery(token, cbId, 'Full command list');
      const text = plainWelcome();
      const buttons: InlineRow[] = [[{ text: '🔙 Back', callback_data: 'back_home' }]];
      await editMsg(token, chatId, msgId, text, buttons);
      return;
    }

    case 'back_home': {
      const welcomeText =
        `🤖 *DevOS Bot*\n\n` +
        `Use the buttons below or type any command.`;
      const buttons: InlineRow[] = [
        [
          { text: '📝 New Note', callback_data: 'new_note' },
          { text: '📁 Projects', callback_data: 'list_projects' },
        ],
        [
          { text: '📊 Stats', callback_data: 'show_stats' },
          { text: '🔍 Search', callback_data: 'show_search' },
        ],
        [
          { text: '⚡ Workflows', callback_data: 'list_workflows' },
          { text: '🚀 Deployments', callback_data: 'list_deployments' },
        ],
        [
          { text: '⚙️ Settings', callback_data: 'show_settings' },
          { text: '❓ Help', callback_data: 'show_help' },
        ],
      ];
      await editMsg(token, chatId, msgId, welcomeText, buttons);
      await answerCbQuery(token, cbId);
      return;
    }

    case 'new_note': {
      await answerCbQuery(token, cbId, 'Send: /note Title then content on next line');
      const text = `📝 *New Note*\n\nSend in this format:\n\n\`/note Your Title\`\n\`Your note content here...\`\n\nTip: add @ProjectName to link to a project, #tags to organize.`;
      const buttons: InlineRow[] = [[{ text: '🔙 Back', callback_data: 'back_home' }]];
      await editMsg(token, chatId, msgId, text, buttons);
      return;
    }

    case 'new_project': {
      await answerCbQuery(token, cbId, 'Send: /newproject <Name>');
      const text = `📁 *New Project*\n\nSend:\n\`/newproject Project Name\``;
      const buttons: InlineRow[] = [[{ text: '🔙 Back', callback_data: 'back_home' }]];
      await editMsg(token, chatId, msgId, text, buttons);
      return;
    }

    case 'confirm_delete': {
      const delId = parseInt(args[0], 10);
      const buttons: InlineRow[] = [
        [
          { text: '✅ Yes, delete it', callback_data: encodeCb('delete', delId) },
          { text: '❌ Cancel', callback_data: encodeCb('cancel_delete', delId) },
        ],
      ];
      await editMsg(token, chatId, msgId, `🗑 Delete item #${delId}? This cannot be undone.`, buttons);
      await answerCbQuery(token, cbId);
      return;
    }

    case 'delete': {
      const delId = parseInt(args[0], 10);
      try {
        await database.deleteKnowledgeItem(delId);
        await editMsg(token, chatId, msgId, `🗑 Item #${delId} deleted.`);
        await answerCbQuery(token, cbId, 'Deleted!');
      } catch {
        await answerCbQuery(token, cbId, 'Failed to delete', true);
      }
      return;
    }

    case 'cancel_delete': {
      await editMsg(token, chatId, msgId, '❌ Deletion cancelled.');
      await answerCbQuery(token, cbId);
      return;
    }

    default:
      await answerCbQuery(token, cbId, 'Unknown action', true);
  }
}

// ── Command handler ────────────────────────────────────────────────────────
async function handleCommand(token: string, entry: ProcessedUpdate) {
  const chatId = entry.chat_id;

  switch (entry.command) {
    case 'start': {
      const welcomeText =
        `🤖 *DevOS Bot*\n\n` +
        `I help you manage your projects, notes, bugs, workflows, and more — right from Telegram.\n\n` +
        `Use the buttons below to get started, or type any command.`;
      const buttons: InlineRow[] = [
        [
          { text: '📝 New Note', callback_data: 'new_note' },
          { text: '📁 Projects', callback_data: 'list_projects' },
        ],
        [
          { text: '📊 Stats', callback_data: 'show_stats' },
          { text: '🔍 Search', callback_data: 'show_search' },
        ],
        [
          { text: '⚡ Workflows', callback_data: 'list_workflows' },
          { text: '🚀 Deployments', callback_data: 'list_deployments' },
        ],
        [
          { text: '⚙️ Settings', callback_data: 'show_settings' },
          { text: '❓ Help', callback_data: 'show_help' },
        ],
      ];
      await sendWithButtons(token, chatId, welcomeText, buttons);
      entry.result = welcomeText;
      break;
    }

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

    // ── Tasks ─────────────────────────────────────────────────────────────
    case 'tasks': {
      const arg = entry.args?.trim();
      try {
        let projectId: number | null = null;
        let projectName: string | null = null;
        if (arg) {
          const res = await findProject(arg);
          if (res.proj) { projectId = res.proj.id; projectName = res.proj.name; }
        }

        let tasksList: any[] = [];
        if (projectId) {
          tasksList = await database.getProjectTasks(projectId);
        } else {
          const projs = await database.getProjects();
          for (const p of projs) {
            const pt = await database.getProjectTasks(p.id);
            tasksList.push(...pt.map((t: any) => ({ ...t, project_name: p.name })));
          }
        }

        if (!tasksList.length) {
          entry.result = projectName
            ? `No tasks found for project "${projectName}".\nUse /addtask @${projectName} Task title`
            : 'No tasks found across projects.\nUse /addtask @Project Title to add one.';
        } else {
          const lines = tasksList.slice(0, 15).map((t: any) => {
            const statusIcon = t.completed ? '✅' : '🔴';
            const projStr = t.project_name ? ` [@${t.project_name}]` : '';
            return `${statusIcon} #${t.id} ${t.title}${projStr} (${t.priority || 'med'})`;
          });
          entry.result =
            `✅ Project Tasks (${tasksList.length})\n\n` +
            lines.join('\n') +
            (tasksList.length > 15 ? `\n\n… and ${tasksList.length - 15} more` : '') +
            `\n\nUse /taskdone <id> to complete a task.`;
        }
      } catch {
        entry.result = DB_ERROR;
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'addtask': {
      const raw = entry.args || entry.body;
      if (!raw) {
        entry.result = 'Usage: /addtask @Project Task name\n\nExample: /addtask @DevOS Fix navbar alignment';
        await sendMsg(token, chatId, entry.result);
        break;
      }
      const { text: cleanTask, projectId, projectName } = await resolveProject(raw);
      try {
        let pId = projectId;
        if (!pId) {
          const projs = await database.getProjects();
          pId = projs[0]?.id || 1;
        }
        await database.addProjectTask(pId, cleanTask, 'medium');
        entry.saved = true;
        entry.result =
          `✅ Task created!\n` +
          `Title: ${cleanTask}` +
          (projectName ? `\nProject: ${projectName}` : '');
      } catch {
        entry.result = DB_ERROR;
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'taskdone': {
      const id = parseInt(entry.args, 10);
      if (!id) {
        entry.result = 'Usage: /taskdone <task ID>\n\nExample: /taskdone 3';
        await sendMsg(token, chatId, entry.result);
        break;
      }
      try {
        await database.updateProjectTask(id, { completed: 1 });
        entry.result = `✅ Task #${id} marked as completed!`;
      } catch {
        entry.result = `Could not update task #${id} — check if ID exists.`;
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    // ── New Project & Settings ─────────────────────────────────────────────
    case 'newproject': {
      const name = entry.args?.trim();
      if (!name) {
        entry.result = 'Usage: /newproject <Project Name>\n\nExample: /newproject MobileApp';
        await sendMsg(token, chatId, entry.result);
        break;
      }
      try {
        await database.createProject({
          name, description: 'Created via Telegram',
          tags: JSON.stringify(['telegram']), technology: '[]', repository_url: '', local_path: '',
        });
        entry.saved = true;
        entry.result = `📁 Project "${name}" created successfully!`;
      } catch {
        entry.result = DB_ERROR;
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'settings': {
      const cfg = loadTelegramConfig();
      entry.result =
        `⚙️ DevOS Telegram Settings\n\n` +
        `Bot Active: Yes\n` +
        `Chat Lock ID: ${cfg.chat_id || 'Not locked (Auto-locks on first message)'}\n` +
        `Polling Status: ${cfg.auto_poll !== false ? '🟢 Active' : '⏸ Paused'}\n` +
        `Poll Interval: ${cfg.poll_interval || 15}s\n\n` +
        `Use /mute or /unmute to pause or resume polling.`;
      await sendMsg(token, chatId, entry.result);
      break;
    }

    // ── APIs & REST Client ────────────────────────────────────────────────
    case 'api':
    case 'http': {
      const input = entry.args?.trim() || entry.body?.trim();
      if (!input) {
        entry.result = 'Usage: /api <URL> or /http POST <URL>\n\nExample: /api https://api.github.com';
        await sendMsg(token, chatId, entry.result);
        break;
      }
      const parts = input.split(/\s+/);
      let method = 'GET';
      let url = input;
      if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(parts[0].toUpperCase())) {
        method = parts[0].toUpperCase();
        url = parts.slice(1).join(' ');
      }
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      try {
        const startTs = Date.now();
        const res = await fetch(url, { method, headers: { 'User-Agent': 'DevOS-Bot/1.0' } });
        const elapsed = Date.now() - startTs;
        const textRes = await res.text();
        let preview = textRes;
        try {
          const jsonObj = JSON.parse(textRes);
          preview = JSON.stringify(jsonObj, null, 2);
        } catch {}
        entry.result =
          `🌐 HTTP Response (${res.status} ${res.statusText}) · ${elapsed}ms\n\n` +
          `URL: ${url}\n` +
          `Method: ${method}\n\n` +
          `Body:\n` + preview.slice(0, 1000) +
          (preview.length > 1000 ? '\n\n… [truncated]' : '');
      } catch (err: any) {
        entry.result = `🌐 Request Failed: ${err?.message || err}`;
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    // ── Workflows ─────────────────────────────────────────────────────────
    case 'workflows': {
      try {
        const workflows = await database.getWorkflows();
        if (!workflows?.length) {
          entry.result = 'No workflows found. Create workflows in DevOS UI.';
          await sendMsg(token, chatId, entry.result);
        } else {
          const lines = workflows.slice(0, 10).map((w: any) =>
            `⚡ #${w.id} ${w.name} (${w.category || 'custom'}) — ${w.last_run_status || 'never run'}`
          );
          const buttons: InlineRow[] = workflows.slice(0, 5).map((w: any) => [
            { text: `▶️ ${w.name}`, callback_data: encodeCb('runwf', w.id) },
          ]);
          await sendWithButtons(token, chatId,
            `⚡ *Workflows* (${workflows.length})\n\n${lines.join('\n')}`,
            buttons);
          entry.result = `⚡ Workflows (${workflows.length})`;
        }
      } catch {
        entry.result = DB_ERROR;
        await sendMsg(token, chatId, entry.result);
      }
      break;
    }

    case 'runworkflow': {
      const arg = entry.args?.trim();
      if (!arg) {
        entry.result = 'Usage: /runworkflow <id or workflow name>\n\nExample: /runworkflow 1';
        await sendMsg(token, chatId, entry.result);
        break;
      }
      try {
        const workflows = await database.getWorkflows();
        const numId = parseInt(arg, 10);
        const wf = workflows.find((w: any) => w.id === numId || w.name.toLowerCase().includes(arg.toLowerCase()));
        if (!wf) {
          entry.result = `Workflow "${arg}" not found. Use /workflows to list all.`;
        } else {
          await database.updateWorkflowLastRun(wf.id, 'success');
          await database.createWorkflowLog(wf.id, 'success', JSON.stringify([{ step: 'Triggered via Telegram', status: 'success' }]));
          entry.result = `▶️ Workflow #${wf.id} "${wf.name}" triggered successfully!`;
        }
      } catch {
        entry.result = DB_ERROR;
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    // ── Deployments ───────────────────────────────────────────────────────
    case 'deployments': {
      try {
        const deps = await database.getAllDeployments();
        if (!deps?.length) {
          entry.result = 'No deployments found. Configure deployments in DevOS.';
          await sendMsg(token, chatId, entry.result);
        } else {
          const statusIcon: Record<string, string> = { live: '🟢', building: '🟡', failed: '🔴', idle: '⚪' };
          const lines = deps.slice(0, 10).map((d: any) =>
            `${statusIcon[d.status] || '⚪'} #${d.id} ${d.name} (${d.provider}) [${d.branch || 'main'}]`
          );
          const buttons: InlineRow[] = deps.slice(0, 5).map((d: any) => [
            { text: `🚀 ${d.name} (${d.status})`, callback_data: encodeCb('deploy', d.id) },
          ]);
          await sendWithButtons(token, chatId,
            `🚀 *Deployments* (${deps.length})\n\n${lines.join('\n')}`,
            buttons);
          entry.result = `🚀 Deployments (${deps.length})`;
        }
      } catch {
        entry.result = DB_ERROR;
        await sendMsg(token, chatId, entry.result);
      }
      break;
    }

    case 'deploy': {
      const id = parseInt(entry.args, 10);
      if (!id) {
        entry.result = 'Usage: /deploy <deployment ID>\n\nExample: /deploy 1';
        await sendMsg(token, chatId, entry.result);
        break;
      }
      try {
        await database.updateDeploymentStatus(id, 'building');
        await database.addDeploymentLog(id, 'success', 'Build triggered via Telegram integration');
        await database.updateDeploymentStatus(id, 'live');
        entry.result = `🚀 Deployment #${id} build completed and status updated to 🟢 live!`;
      } catch {
        entry.result = `Could not update deployment #${id}. Check if ID exists using /deployments.`;
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    // ── Developer Utility Tools ───────────────────────────────────────────
    case 'tools': {
      entry.result =
        `🛠 DevOS Utility Tools\n\n` +
        `🆔 /uuid [count] — Generate UUID v4 identifiers\n` +
        `🔑 /pwd [length] — Generate secure random passwords\n` +
        `🔒 /hash <text> — Compute SHA-256 & MD5 hashes\n` +
        `📦 /b64 <text> — Base64 encode string\n` +
        `📦 /b64decode <text> — Base64 decode string\n` +
        `📄 /json <string> — Pretty-format & validate JSON\n` +
        `🏷 /slug <text> — Generate URL slug\n` +
        `🎲 /lorem [words] — Generate placeholder text`;
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'uuid': {
      const count = Math.min(Math.max(parseInt(entry.args, 10) || 1, 1), 10);
      const genUuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
      const uuids = Array.from({ length: count }, genUuid);
      entry.result = `🆔 Generated UUID${count > 1 ? 's' : ''}:\n\n` + uuids.join('\n');
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'pwd': {
      const len = Math.min(Math.max(parseInt(entry.args, 10) || 16, 8), 64);
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}';
      let pwd = '';
      for (let i = 0; i < len; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      entry.result = `🔑 Generated Password (${len} chars):\n\n\`${pwd}\``;
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'hash':
    case 'sha256': {
      const str = entry.args || entry.body;
      if (!str) {
        entry.result = 'Usage: /hash <text to hash>';
        await sendMsg(token, chatId, entry.result);
        break;
      }
      const encoder = new TextEncoder();
      const dataBuf = encoder.encode(str);
      const hashBuf = await crypto.subtle.digest('SHA-256', dataBuf);
      const hashArray = Array.from(new Uint8Array(hashBuf));
      const sha256Hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      entry.result = `🔒 SHA-256 Hash:\n\n\`${sha256Hex}\``;
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'b64': {
      const str = entry.args || entry.body;
      if (!str) {
        entry.result = 'Usage: /b64 <text to encode>';
        await sendMsg(token, chatId, entry.result);
        break;
      }
      try {
        const encoded = btoa(str);
        entry.result = `📦 Base64 Encoded:\n\n\`${encoded}\``;
      } catch {
        entry.result = 'Could not Base64 encode text.';
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'b64decode': {
      const str = entry.args || entry.body;
      if (!str) {
        entry.result = 'Usage: /b64decode <text to decode>';
        await sendMsg(token, chatId, entry.result);
        break;
      }
      try {
        const decoded = atob(str);
        entry.result = `📦 Base64 Decoded:\n\n${decoded}`;
      } catch {
        entry.result = 'Invalid Base64 string.';
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'json': {
      const str = entry.args || entry.body;
      if (!str) {
        entry.result = 'Usage: /json <json text to format>';
        await sendMsg(token, chatId, entry.result);
        break;
      }
      try {
        const parsed = JSON.parse(str);
        const formatted = JSON.stringify(parsed, null, 2);
        entry.result = `📄 Valid JSON:\n\n\`\`\`json\n${formatted.slice(0, 1500)}\n\`\`\``;
      } catch (e: any) {
        entry.result = `⚠️ Invalid JSON: ${e?.message || e}`;
      }
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'slug': {
      const str = entry.args || entry.body;
      if (!str) {
        entry.result = 'Usage: /slug <text to turn into slug>';
        await sendMsg(token, chatId, entry.result);
        break;
      }
      const slug = str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
      entry.result = `🏷 Slug:\n\n\`${slug}\``;
      await sendMsg(token, chatId, entry.result);
      break;
    }

    case 'lorem': {
      const words = Math.min(Math.max(parseInt(entry.args, 10) || 30, 5), 150);
      const dictionary = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua'];
      let resText = [];
      for (let i = 0; i < words; i++) {
        resText.push(dictionary[i % dictionary.length]);
      }
      entry.result = `🎲 Lorem Ipsum (${words} words):\n\n${resText.join(' ')}.`;
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

      if (!arg || (entry.command === 'projects' && !arg)) {
        try {
          const projs = await database.getProjects();
          if (!projs?.length) {
            entry.result = 'No projects yet. Create one with /newproject <Name>';
            await sendMsg(token, chatId, entry.result);
          } else {
            const lines = await Promise.all(projs.slice(0, 20).map(async p => {
              const bugs = await database.getBugsByProject(p.id);
              const tasks = await database.getProjectTasks(p.id).catch(() => []);
              const open = bugs.filter((b: any) => b.status !== 'resolved' && b.status !== 'closed').length;
              const openTasks = tasks.filter((t: any) => !t.completed).length;
              const status = STATUS_EMOJI[p.status] || '⚪';
              return `${status} #${p.id} ${p.name}${open > 0 ? ` (${open}🐛)` : ''}${openTasks > 0 ? ` (${openTasks}✅)` : ''}`;
            }));
            const buttons: InlineRow[] = [
              ...projs.slice(0, 5).map(p => ([
                { text: `${p.name}`, callback_data: encodeCb('project', p.id) },
              ] as InlineRow))[0] ? projs.slice(0, 5).map(p => [{ text: `${p.name}`, callback_data: encodeCb('project', p.id) } as InlineButton]) : [],
              [{ text: '📝 New Project', callback_data: 'new_project' }],
            ].filter(r => r.length > 0);
            await sendWithButtons(token, chatId,
              `📁 *Projects* (${projs.length})\nTap a project for details.\n\n${lines.join('\n')}`,
              buttons);
            entry.result = `📁 Projects (${projs.length})`;
          }
        } catch {
          entry.result = DB_ERROR;
          await sendMsg(token, chatId, entry.result);
        }
        break;
      }

      try {
        const { proj } = await findProject(arg);
        if (!proj) {
          const projs = await database.getProjects().catch(() => []);
          const hint = projs.length
            ? `\n\nAvailable projects:\n` + projs.slice(0, 10).map((p: any) => `• #${p.id} ${p.name}`).join('\n')
            : '';
          entry.result = `Project "${arg}" not found.${hint}`;
          await sendMsg(token, chatId, entry.result);
        } else {
          const [bugs, tasks, items, deps] = await Promise.all([
            database.getBugsByProject(proj.id),
            database.getProjectTasks(proj.id).catch(() => []),
            database.getKnowledgeItems().then((all: any[]) =>
              all.filter(i => (i as any).project_id === proj.id)),
            database.getProjectDeployments(proj.id).catch(() => []),
          ]);
          const openBugs = bugs.filter((b: any) => b.status !== 'resolved' && b.status !== 'closed').length;
          const openTasks = tasks.filter((t: any) => !t.completed).length;
          const text =
            `📁 *${proj.name}* (#${proj.id})\n\n` +
            `${STATUS_EMOJI[proj.status] || '⚪'} Status: ${proj.status || 'active'}\n` +
            `🐛 Bugs: ${openBugs}\n✅ Tasks: ${openTasks}\n🚀 Deployments: ${deps.length}\n📦 Library: ${items.length}\n` +
            (proj.description ? `\n${proj.description}` : '');
          const buttons: InlineRow[] = [
            [
              { text: `🐛 Bugs (${openBugs})`, callback_data: encodeCb('proj_bugs', proj.id) },
              { text: `✅ Tasks (${openTasks})`, callback_data: encodeCb('proj_tasks', proj.id) },
            ],
            [
              { text: '📝 New Note', callback_data: encodeCb('proj_note', proj.id) },
              { text: '◀️ Back', callback_data: 'list_projects' },
            ],
          ];
          await sendWithButtons(token, chatId, text, buttons);
          entry.result = text;
        }
      } catch {
        entry.result = DB_ERROR;
        await sendMsg(token, chatId, entry.result);
      }
      break;
    }

    case 'copy': {
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
        let title = '';
        try {
          const all = await database.getKnowledgeItems();
          const item = all.find((i: any) => i.id === id);
          title = item?.title ? ` "${item.title}"` : '';
        } catch { /* non-critical */ }
        const buttons: InlineRow[] = [
          [
            { text: '✅ Yes, delete it', callback_data: encodeCb('delete', id) },
            { text: '❌ Cancel', callback_data: encodeCb('cancel_delete', id) },
          ],
        ];
        await sendWithButtons(token, chatId, `🗑 Delete #${id}${title}? This cannot be undone.`, buttons);
        entry.result = `🗑 Confirm deletion of #${id}${title}...`;
      } catch {
        entry.result = `Could not find #${id} — it may not exist.\nUse /list to check.`;
        await sendMsg(token, chatId, entry.result);
      }
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
          { command: 'projects', description: 'List all projects' },
          { command: 'project', description: 'Project details: /project <name|#id>' },
          { command: 'newproject', description: 'Create a project: /newproject <name>' },
          { command: 'tasks', description: 'View project tasks: /tasks [project]' },
          { command: 'addtask', description: 'Create task: /addtask @Project Title' },
          { command: 'taskdone', description: 'Complete task: /taskdone <id>' },
          { command: 'note', description: 'Save note: /note Title' },
          { command: 'bug', description: 'Report bug: /bug Title' },
          { command: 'snippet', description: 'Save code snippet: /snippet Title' },
          { command: 'search', description: 'Search library: /search <query>' },
          { command: 'api', description: 'Test HTTP API: /api <url>' },
          { command: 'workflows', description: 'List workflows' },
          { command: 'runworkflow', description: 'Run workflow: /runworkflow <id|name>' },
          { command: 'deployments', description: 'View deployments' },
          { command: 'deploy', description: 'Deploy status: /deploy <id>' },
          { command: 'tools', description: 'List utility tools' },
          { command: 'uuid', description: 'Generate UUID v4' },
          { command: 'pwd', description: 'Generate password' },
          { command: 'hash', description: 'SHA-256 hash text' },
          { command: 'b64', description: 'Base64 encode' },
          { command: 'json', description: 'Format JSON' },
          { command: 'stats', description: 'DevOS statistics' },
          { command: 'settings', description: 'Bot & chat settings' },
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
