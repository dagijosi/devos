import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  FaTelegram, FaSync, FaTrash, FaCog, FaCheck, FaPause, FaPlay,
  FaSearch, FaTimes, FaCopy, FaChevronDown, FaChevronUp, FaWifi,
} from 'react-icons/fa';
import {
  loadTelegramConfig, saveTelegramConfig, UPDATES_KEY, type TelegramConfig,
} from '../../telegramConfig';
import {
  processTelegramUpdates, setBotCommands, type ProcessedUpdate,
} from '../../telegramBot';
import { database } from '../../../../database';
import { KNOWLEDGE } from '../../../../routes/types/routeConstants';

const API = 'https://api.telegram.org/bot';

// ── Helpers ──────────────────────────────────────────────────────────────
function loadUpdates(): ProcessedUpdate[] {
  try { return JSON.parse(localStorage.getItem(UPDATES_KEY) || '[]'); }
  catch { return []; }
}
function saveUpdates(u: ProcessedUpdate[]) {
  localStorage.setItem(UPDATES_KEY, JSON.stringify(u.slice(0, 200)));
}
function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── Types ────────────────────────────────────────────────────────────────
interface Project { id: number; name: string; status: string }
interface TimestampedUpdate extends ProcessedUpdate { ts?: number }

// ── Command reference data ───────────────────────────────────────────────
const CMD_GROUPS = [
  {
    label: 'Create',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/8',
    border: 'border-emerald-500/15',
    cmds: [
      { cmd: '/note Title', sub: 'body on next line · #tags · @Project' },
      { cmd: '/bug Title', sub: 'problem on next line · @Project' },
      { cmd: '/todo Task', sub: 'add to-do · #tags · @Project' },
      { cmd: '/snippet Title', sub: 'code on next line · @Project' },
    ],
  },
  {
    label: 'Browse',
    color: 'text-blue-400',
    bg: 'bg-blue-500/8',
    border: 'border-blue-500/15',
    cmds: [
      { cmd: '/search query', sub: 'search knowledge base' },
      { cmd: '/list notes|bugs|all', sub: 'list by type with IDs' },
      { cmd: '/recent [type]', sub: 'last 8 items with IDs' },
    ],
  },
  {
    label: 'Projects',
    color: 'text-amber-400',
    bg: 'bg-amber-500/8',
    border: 'border-amber-500/15',
    cmds: [
      { cmd: '/projects', sub: 'list all projects with #id' },
      { cmd: '/project <name or #id>', sub: 'project details & stats' },
      { cmd: '/copy', sub: 'copy project ID list' },
    ],
  },
  {
    label: 'Manage',
    color: 'text-rose-400',
    bg: 'bg-rose-500/8',
    border: 'border-rose-500/15',
    cmds: [
      { cmd: '/delete <id>', sub: 'delete item by ID' },
      { cmd: '/pin <id>', sub: 'toggle favorite' },
      { cmd: '/undo', sub: 'delete last saved item' },
    ],
  },
  {
    label: 'Stats',
    color: 'text-purple-400',
    bg: 'bg-purple-500/8',
    border: 'border-purple-500/15',
    cmds: [
      { cmd: '/stats', sub: 'full knowledge base stats' },
      { cmd: '/today', sub: "today's activity" },
      { cmd: '/weekly', sub: 'this week vs last week' },
    ],
  },
  {
    label: 'Settings',
    color: 'text-theme-text/50',
    bg: 'bg-theme-surface/40',
    border: 'border-theme-border/15',
    cmds: [
      { cmd: '/id', sub: 'show this chat ID' },
      { cmd: '/mute · /unmute', sub: 'pause / resume polling' },
      { cmd: '/help', sub: 'show all commands' },
    ],
  },
];

const STATUS_EMOJI: Record<string, string> = { active: '🟢', archived: '🔴', planning: '🟡' };

// ── Component ────────────────────────────────────────────────────────────
export function TelegramConnector() {
  const [config, setConfig] = useState<TelegramConfig>(loadTelegramConfig);
  const [updates, setUpdates] = useState<TimestampedUpdate[]>(() =>
    loadUpdates().map(u => ({ ...u, ts: Date.now() }))
  );
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(!loadTelegramConfig().bot_token);
  const [botInfo, setBotInfo] = useState<{ username: string; name: string } | null>(null);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [logFilter, setLogFilter] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjects, setShowProjects] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSkipped, setShowSkipped] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [, setTick] = useState(0); // Force re-render for relative timestamps

  // ── Online / offline ─────────────────────────────────────────────────
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // ── Tick for relative timestamps ─────────────────────────────────────
  useEffect(() => {
    tickRef.current = setInterval(() => setTick(t => t + 1), 30_000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  const save = useCallback((patch: Partial<TelegramConfig>) => {
    const next = { ...loadTelegramConfig(), ...patch };
    if (patch.bot_token && patch.auto_poll === undefined) next.auto_poll = true;
    setConfig(next);
    saveTelegramConfig(next);
  }, []);

  // ── Load projects ────────────────────────────────────────────────────
  const loadProjects = useCallback(async () => {
    try {
      const projs = await database.getProjects();
      setProjects(projs.map((p: any) => ({ id: p.id, name: p.name, status: p.status || 'active' })));
    } catch { /* DB not ready yet */ }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  useEffect(() => {
    const onKnowledge = () => loadProjects();
    window.addEventListener('knowledge-updated', onKnowledge);
    return () => window.removeEventListener('knowledge-updated', onKnowledge);
  }, [loadProjects]);

  // ── Bot info on token change ─────────────────────────────────────────
  useEffect(() => {
    if (!config.bot_token) return;
    (async () => {
      try {
        const res = await fetch(`${API}${config.bot_token}/getMe`);
        const data = await res.json();
        if (data.ok) {
          setBotInfo({ username: data.result.username, name: data.result.first_name });
          await setBotCommands(config.bot_token);
        }
      } catch {}
    })();
  }, [config.bot_token]);

  useEffect(() => { saveUpdates(updates); }, [updates]);

  // ── React to polling events ──────────────────────────────────────────
  useEffect(() => {
    const refresh = () => {
      setUpdates(loadUpdates().map(u => ({ ...u, ts: (u as TimestampedUpdate).ts ?? Date.now() })));
      setConfig(loadTelegramConfig());
      setLastSync(Date.now());
    };
    window.addEventListener('telegram-updates', refresh);
    window.addEventListener('telegram-config', refresh);
    return () => {
      window.removeEventListener('telegram-updates', refresh);
      window.removeEventListener('telegram-config', refresh);
    };
  }, []);

  // ── Test connection ──────────────────────────────────────────────────
  const testConnection = async () => {
    if (!config.bot_token) { toast.error('Enter bot token first'); return; }
    try {
      const res = await fetch(`${API}${config.bot_token}/getMe`);
      const data = await res.json();
      if (data.ok) {
        setBotInfo({ username: data.result.username, name: data.result.first_name });
        const cmdsOk = await setBotCommands(config.bot_token);
        save({ auto_poll: true });
        toast.success(`Connected as @${data.result.username}${cmdsOk ? ' · commands registered' : ''}`);
      } else {
        toast.error(`Telegram API: ${data.description}`);
      }
    } catch { toast.error('Connection failed — check your token and internet'); }
  };

  // ── Manual sync ──────────────────────────────────────────────────────
  const syncNow = async () => {
    if (!config.bot_token) { toast.error('Configure bot token first'); return; }
    setLoading(true);
    try {
      const c = loadTelegramConfig();
      const offset = c.last_update_id ? c.last_update_id + 1 : 0;
      const res = await fetch(`${API}${c.bot_token}/getUpdates?offset=${offset}&timeout=8`);
      const data = await res.json();
      if (!data.ok) { toast.error(`API: ${data.description}`); setLoading(false); return; }
      if (!data.result?.length) {
        toast('No pending messages — send /start to your bot, then Sync again');
        setLastSync(Date.now());
        setLoading(false);
        return;
      }
      const processed = await processTelegramUpdates(c.bot_token, c.chat_id, data.result);
      const ts = Date.now();
      setUpdates(prev => [...processed.map(p => ({ ...p, ts })), ...prev].slice(0, 200));
      const maxId = Math.max(...data.result.map((u: any) => u.update_id));
      save({ last_update_id: maxId });
      setLastSync(ts);
      const replied = processed.filter(p => !p.skipped && p.result);
      const byCmd = replied.reduce((acc, u) => { acc[u.command] = (acc[u.command] || 0) + 1; return acc; }, {} as Record<string, number>);
      const summary = Object.entries(byCmd).map(([cmd, n]) => `${n}× /${cmd}`).join(', ');
      toast.success(`Processed ${replied.length}: ${summary || 'messages'}`);
    } catch (e: any) { toast.error(`Error: ${e.message}`); }
    setLoading(false);
  };

  // ── Copy project ID ──────────────────────────────────────────────────
  const copyProjectId = (id: number) => {
    navigator.clipboard.writeText(String(id)).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
      toast.success(`Copied #${id}`);
    });
  };

  const clearUpdates = () => { setUpdates([]); saveUpdates([]); };

  const ic = 'w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50';

  const visibleUpdates = updates.filter(u =>
    showSkipped ? true : !u.skipped
  ).filter(u =>
    !logFilter ||
    u.text?.toLowerCase().includes(logFilter.toLowerCase()) ||
    u.command?.toLowerCase().includes(logFilter.toLowerCase()) ||
    u.result?.toLowerCase().includes(logFilter.toLowerCase())
  );

  const skippedCount = updates.filter(u => u.skipped).length;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Status bar ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-theme-border/15 bg-theme-background/40 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Bot icon with animated poll indicator */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-lg bg-[#229ED9]/15 flex items-center justify-center">
                <FaTelegram className="w-4 h-4 text-[#229ED9]" />
              </div>
              {config.bot_token && config.auto_poll !== false && isOnline && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-theme-background animate-pulse" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-theme-text truncate">
                  {botInfo ? `@${botInfo.username}` : 'Telegram Bot'}
                </p>
                {/* Online / offline badge */}
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  <FaWifi className="w-2 h-2" />
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <p className="text-[10px] text-theme-text/40 mt-0.5">
                {config.bot_token
                  ? config.auto_poll !== false
                    ? `Polling every ${config.poll_interval || 15}s`
                    : '⏸ Polling paused'
                  : 'Not configured — click ⚙️ to set up'}
                {lastSync ? ` · synced ${timeAgo(lastSync)}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {config.bot_token && (
              <button
                onClick={() => save({ auto_poll: !config.auto_poll })}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium border border-theme-border/20 text-theme-text/60 hover:text-theme-text hover:bg-theme-surface transition-colors"
                title={config.auto_poll === false ? 'Resume background polling' : 'Pause background polling'}
              >
                {config.auto_poll === false ? <FaPlay className="w-2.5 h-2.5" /> : <FaPause className="w-2.5 h-2.5" />}
                {config.auto_poll === false ? 'Resume' : 'Pause'}
              </button>
            )}
            <button
              onClick={() => setShowConfig(v => !v)}
              className={`p-2 rounded-lg transition-colors ${showConfig ? 'text-theme-icon bg-theme-icon/10' : 'text-theme-text/35 hover:text-theme-text hover:bg-theme-surface'}`}
              title="Settings"
            >
              <FaCog className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={syncNow}
              disabled={loading || !config.bot_token || !isOnline}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 disabled:opacity-40 transition-colors"
              title={!isOnline ? 'Offline — cannot sync' : undefined}
            >
              <FaSync className={`w-2.5 h-2.5 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </button>
          </div>
        </div>
      </div>

      {/* ── Config panel ───────────────────────────────────────────── */}
      {showConfig && (
        <div className="rounded-xl border border-theme-border/20 bg-theme-surface p-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-theme-text">Bot setup</p>
            <p className="text-[10px] text-theme-text/40 mt-0.5">
              Create a bot with{' '}
              <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-theme-icon underline">@BotFather</a>
              , paste the token, then send <code className="text-theme-text/60">/start</code> to the bot. Messages save into your Library.
            </p>
          </div>
          <input
            value={config.bot_token}
            onChange={e => save({ bot_token: e.target.value.trim() })}
            placeholder="Bot token  (from @BotFather)"
            className={ic}
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <input
                value={config.chat_id}
                onChange={e => save({ chat_id: e.target.value.trim() })}
                placeholder="Chat ID — optional, digits only"
                className={ic}
              />
              {config.chat_id && (
                <button
                  type="button"
                  onClick={() => save({ chat_id: '' })}
                  className="shrink-0 px-2.5 py-2 rounded-lg text-[10px] border border-theme-border/20 text-theme-text/50 hover:text-theme-text hover:bg-theme-background"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-[10px] text-theme-text/35">
              Leave empty — the bot auto-locks to the first chat that messages it.
              Send <code className="text-theme-text/55">/id</code> from Telegram to find your chat ID.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[10px] text-theme-text/40">Poll every</label>
            <select
              value={config.poll_interval || 15}
              onChange={e => save({ poll_interval: Number(e.target.value) })}
              className="bg-theme-background border border-theme-border/20 rounded-lg px-2 py-1.5 text-[10px] text-theme-text outline-none"
            >
              {[5, 10, 15, 30, 60, 120].map(n => <option key={n} value={n}>{n}s</option>)}
            </select>
            <div className="flex-1" />
            <button onClick={testConnection} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon/10 text-theme-icon border border-theme-icon/20 hover:bg-theme-icon/20 transition-colors">
              Test connection
            </button>
            <button onClick={() => setShowConfig(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">
              Done
            </button>
          </div>
          {botInfo && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2">
              <FaCheck className="w-3 h-3" /> Connected as @{botInfo.username}
            </div>
          )}
        </div>
      )}

      {/* ── Projects quick-reference ────────────────────────────────── */}
      <div className="rounded-xl border border-theme-border/15 bg-theme-background/30 overflow-hidden">
        <button
          onClick={() => setShowProjects(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-theme-surface/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-theme-text/60 uppercase tracking-widest">Projects</span>
            {projects.length > 0 && (
              <span className="text-[9px] bg-theme-icon/10 text-theme-icon px-1.5 py-0.5 rounded font-medium">{projects.length}</span>
            )}
            <span className="text-[9px] text-theme-text/30">· click ID to copy for /project command</span>
          </div>
          {showProjects ? <FaChevronUp className="w-2.5 h-2.5 text-theme-text/30" /> : <FaChevronDown className="w-2.5 h-2.5 text-theme-text/30" />}
        </button>
        {showProjects && (
          <div className="px-4 pb-3 pt-1">
            {projects.length === 0 ? (
              <p className="text-[10px] text-theme-text/30 py-2">No projects yet — create one in DevOS.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {projects.map(p => (
                  <div key={p.id} className="flex items-center gap-2 rounded-lg border border-theme-border/10 bg-theme-surface/40 px-2.5 py-1.5">
                    <button
                      onClick={() => copyProjectId(p.id)}
                      className="flex items-center gap-1.5 shrink-0 group"
                      title={`Copy #${p.id} to clipboard`}
                    >
                      <span className={`text-[10px] font-mono font-semibold transition-colors ${copiedId === p.id ? 'text-emerald-400' : 'text-theme-icon group-hover:text-theme-icon/80'}`}>
                        #{p.id}
                      </span>
                      {copiedId === p.id
                        ? <FaCheck className="w-2 h-2 text-emerald-400" />
                        : <FaCopy className="w-2 h-2 text-theme-text/20 group-hover:text-theme-icon transition-colors" />
                      }
                    </button>
                    <span className="text-[10px] text-theme-text/70 truncate flex-1">{p.name}</span>
                    <span className="text-[9px] shrink-0">{STATUS_EMOJI[p.status] || '⚪'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Command reference ───────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-theme-text/40 uppercase tracking-widest px-0.5">Commands</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
          {CMD_GROUPS.map(group => (
            <div key={group.label} className={`rounded-xl border ${group.border} ${group.bg} p-3 space-y-1.5`}>
              <p className={`text-[9px] font-bold uppercase tracking-widest ${group.color}`}>{group.label}</p>
              {group.cmds.map(c => (
                <div key={c.cmd}>
                  <code className="text-[10px] text-theme-text/80 font-mono">{c.cmd}</code>
                  <p className="text-[9px] text-theme-text/35 mt-0.5">{c.sub}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Activity log header ─────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-[220px] relative">
          <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-theme-text/30" />
          <input
            value={logFilter}
            onChange={e => setLogFilter(e.target.value)}
            placeholder="Filter activity..."
            className="w-full bg-theme-background border border-theme-border/20 rounded-lg pl-7 pr-7 py-1.5 text-[10px] text-theme-text outline-none focus:border-theme-icon/50"
          />
          {logFilter && (
            <button onClick={() => setLogFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-theme-text/20 hover:text-theme-text">
              <FaTimes className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {skippedCount > 0 && (
            <button
              onClick={() => setShowSkipped(v => !v)}
              className="text-[10px] text-theme-text/35 hover:text-theme-text/60 transition-colors"
            >
              {showSkipped ? 'Hide' : 'Show'} {skippedCount} skipped
            </button>
          )}
          <p className="text-[10px] text-theme-text/35 shrink-0">{updates.filter(u => !u.skipped).length} events</p>
          <button
            onClick={clearUpdates}
            disabled={!updates.length}
            className="inline-flex items-center gap-1 text-[10px] text-theme-text/30 hover:text-red-400 disabled:opacity-20 transition-colors"
          >
            <FaTrash className="w-2.5 h-2.5" /> Clear
          </button>
        </div>
      </div>

      {/* ── Activity log ───────────────────────────────────────────── */}
      {visibleUpdates.length === 0 && updates.length === 0 ? (
        /* Empty state — onboarding */
        <div className="rounded-xl border border-dashed border-theme-border/20 py-10 px-6 text-center space-y-4">
          <FaTelegram className="w-10 h-10 text-theme-text/10 mx-auto" />
          <div>
            <p className="text-xs font-medium text-theme-text/50">No messages yet</p>
            <p className="text-[10px] text-theme-text/25 mt-1 max-w-sm mx-auto">
              {!config.bot_token
                ? 'Click ⚙️ above to paste your bot token, then send /start from Telegram.'
                : 'Open your bot in Telegram and send /start — messages appear here automatically.'}
            </p>
          </div>
          {!config.bot_token && (
            <div className="flex flex-col items-center gap-1.5 text-[10px] text-theme-text/35">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-theme-icon/15 text-theme-icon flex items-center justify-center text-[8px] font-bold shrink-0">1</span>
                <span>Create a bot at <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-theme-icon underline">@BotFather</a></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-theme-icon/15 text-theme-icon flex items-center justify-center text-[8px] font-bold shrink-0">2</span>
                <span>Click ⚙️ and paste the token</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-theme-icon/15 text-theme-icon flex items-center justify-center text-[8px] font-bold shrink-0">3</span>
                <span>Open your bot in Telegram and send /start</span>
              </div>
            </div>
          )}
        </div>
      ) : visibleUpdates.length === 0 ? (
        <p className="text-center text-[10px] text-theme-text/30 py-6">No matches for "{logFilter}"</p>
      ) : (
        <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-0.5">
          {visibleUpdates.map(u => {
            const isSkipped = u.skipped;
            const isError = u.result?.startsWith('Error') || u.result?.startsWith('⚠️') || u.result?.startsWith('Failed') || u.result?.startsWith('Could not');
            const isSaved = u.saved;
            const borderColor = isSkipped
              ? 'border-l-theme-border/30'
              : isError
              ? 'border-l-red-500/50'
              : isSaved
              ? 'border-l-emerald-500/60'
              : 'border-l-[#229ED9]/40';

            return (
              <div
                key={u.update_id}
                className={`rounded-xl border border-theme-border/10 bg-theme-background/60 overflow-hidden border-l-2 ${borderColor} ${isSkipped ? 'opacity-50' : ''}`}
              >
                <div className="px-3 py-2 flex items-center gap-2 border-b border-theme-border/5">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${isSkipped ? 'bg-theme-border/10 text-theme-text/30' : 'bg-theme-icon/10 text-theme-icon'}`}>
                    /{u.command || 'msg'}
                  </span>
                  <span className="text-[10px] text-theme-text/40 flex-1 truncate">
                    {u.args || (u.text ? u.text.slice(0, 60) : '')}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {u.created_id && (
                      <Link to={KNOWLEDGE} className="text-[9px] text-emerald-400 hover:underline font-medium">
                        Library #{u.created_id}
                      </Link>
                    )}
                    {u.ts && (
                      <span className="text-[9px] text-theme-text/25">{timeAgo(u.ts)}</span>
                    )}
                  </div>
                </div>
                <p className="px-3 py-2 text-[11px] text-theme-text/55 whitespace-pre-wrap leading-relaxed">
                  {u.result}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
