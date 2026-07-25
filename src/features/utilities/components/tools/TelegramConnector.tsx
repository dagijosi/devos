import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { FaTelegram, FaSync, FaTrash, FaCog, FaCheck, FaPause, FaPlay, FaSearch, FaTimes } from 'react-icons/fa';
import { loadTelegramConfig, saveTelegramConfig, UPDATES_KEY, type TelegramConfig } from '../../telegramConfig';
import { processTelegramUpdates, setBotCommands, clearTelegramDedup, type ProcessedUpdate } from '../../telegramBot';
import { KNOWLEDGE } from '../../../../routes/types/routeConstants';

const API = 'https://api.telegram.org/bot';

function loadUpdates(): ProcessedUpdate[] {
  try { return JSON.parse(localStorage.getItem(UPDATES_KEY) || '[]'); }
  catch { return []; }
}
function saveUpdates(u: ProcessedUpdate[]) {
  localStorage.setItem(UPDATES_KEY, JSON.stringify(u.slice(0, 200)));
}

export function TelegramConnector() {
  const [config, setConfig] = useState<TelegramConfig>(loadTelegramConfig);
  const [updates, setUpdates] = useState<ProcessedUpdate[]>(loadUpdates);
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(!config.bot_token);
  const [botInfo, setBotInfo] = useState<{ username: string; name: string } | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState('');

  const save = useCallback((patch: Partial<TelegramConfig>) => {
    const next = { ...loadTelegramConfig(), ...patch };
    // Saving a token should start listening unless user explicitly paused in this patch
    if (patch.bot_token && patch.auto_poll === undefined) next.auto_poll = true;
    setConfig(next);
    saveTelegramConfig(next);
  }, []);

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

  useEffect(() => {
    const refresh = () => {
      setUpdates(loadUpdates());
      setConfig(loadTelegramConfig());
      setLastSync(new Date().toLocaleTimeString());
    };
    window.addEventListener('telegram-updates', refresh);
    window.addEventListener('telegram-config', refresh);
    return () => {
      window.removeEventListener('telegram-updates', refresh);
      window.removeEventListener('telegram-config', refresh);
    };
  }, []);

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
        clearTelegramDedup();
      } else {
        toast.error(`Telegram API: ${data.description}`);
      }
    } catch { toast.error('Connection failed'); }
  };

  const syncNow = async () => {
    if (!config.bot_token) { toast.error('Configure bot token first'); return; }
    setLoading(true);
    try {
      // Allow retrying the next messages even if an earlier attempt marked them processed
      clearTelegramDedup();
      const c = loadTelegramConfig();
      const offset = c.last_update_id ? c.last_update_id + 1 : 0;
      const res = await fetch(`${API}${c.bot_token}/getUpdates?offset=${offset}&timeout=8`);
      const data = await res.json();
      if (!data.ok) { toast.error(`API: ${data.description}`); setLoading(false); return; }
      if (!data.result?.length) {
        toast('No pending messages — send /start to your bot, then Sync again');
        setLoading(false);
        setLastSync(new Date().toLocaleTimeString());
        return;
      }

      const processed = await processTelegramUpdates(c.bot_token, c.chat_id, data.result);
      setUpdates(prev => [...processed, ...prev].slice(0, 200));

      const maxId = Math.max(...data.result.map((u: any) => u.update_id));
      save({ last_update_id: maxId });
      setLastSync(new Date().toLocaleTimeString());

      const replied = processed.filter(p => !p.skipped && p.result);
      const byCmd = replied.reduce((acc, u) => { acc[u.command] = (acc[u.command] || 0) + 1; return acc; }, {} as Record<string, number>);
      const summary = Object.entries(byCmd).map(([cmd, n]) => `${n}× /${cmd}`).join(', ');
      toast.success(`Processed ${replied.length}: ${summary || 'messages'}`);
    } catch (e: any) { toast.error(`Error: ${e.message}`); }
    setLoading(false);
  };

  const clearUpdates = () => { setUpdates([]); saveUpdates([]); };
  const ic = 'w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50';

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-theme-border/15 bg-theme-background/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#229ED9]/15 flex items-center justify-center shrink-0">
            <FaTelegram className="w-4 h-4 text-[#229ED9]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-theme-text truncate">
              {botInfo ? `@${botInfo.username}` : 'Telegram Bot'}
            </p>
            <p className="text-[10px] text-theme-text/40">
              {config.bot_token
                ? (config.auto_poll !== false ? `Polling every ${config.poll_interval || 15}s` : 'Polling paused')
                : 'Not configured'}
              {lastSync ? ` · last sync ${lastSync}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {config.bot_token && (
            <button
              onClick={() => save({ auto_poll: config.auto_poll === false })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium border border-theme-border/20 text-theme-text/60 hover:text-theme-text hover:bg-theme-surface transition-colors"
              title={config.auto_poll === false ? 'Resume background polling' : 'Pause background polling'}
            >
              {config.auto_poll === false ? <FaPlay className="w-2.5 h-2.5" /> : <FaPause className="w-2.5 h-2.5" />}
              {config.auto_poll === false ? 'Resume' : 'Pause'}
            </button>
          )}
          <button onClick={() => setShowConfig(v => !v)} className="p-2 rounded-lg text-theme-text/35 hover:text-theme-text hover:bg-theme-surface transition-colors" title="Settings">
            <FaCog className="w-3.5 h-3.5" />
          </button>
          <button onClick={syncNow} disabled={loading || !config.bot_token}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 disabled:opacity-40 transition-colors">
            <FaSync className={`w-2.5 h-2.5 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="rounded-xl border border-theme-border/20 bg-theme-surface p-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-theme-text">Bot setup</p>
            <p className="text-[10px] text-theme-text/40 mt-0.5">
              Create a bot with <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-theme-icon underline">@BotFather</a>, paste the token, then message the bot. Messages save into your Library.
            </p>
          </div>
          <input value={config.bot_token} onChange={e => save({ bot_token: e.target.value.trim() })} placeholder="Bot token" className={ic} />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <input
                value={config.chat_id}
                onChange={e => save({ chat_id: e.target.value.trim() })}
                placeholder="Chat ID (numbers only, or leave empty)"
                className={ic}
              />
              {config.chat_id ? (
                <button
                  type="button"
                  onClick={() => save({ chat_id: '' })}
                  className="shrink-0 px-2.5 py-2 rounded-lg text-[10px] border border-theme-border/20 text-theme-text/50 hover:text-theme-text hover:bg-theme-background"
                >
                  Clear
                </button>
              ) : null}
            </div>
            <p className="text-[10px] text-theme-text/35">
              Optional lock to one Telegram chat. Must be digits (e.g. <code className="text-theme-text/55">5019457140</code>).
              Leave empty to accept the first chat that messages the bot — text like “main” is ignored.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[10px] text-theme-text/40">Poll every</label>
            <select value={config.poll_interval || 15} onChange={e => save({ poll_interval: Number(e.target.value) })}
              className="bg-theme-background border border-theme-border/20 rounded-lg px-2 py-1.5 text-[10px] text-theme-text outline-none">
              {[5, 10, 15, 30, 60, 120].map(n => <option key={n} value={n}>{n}s</option>)}
            </select>
            <div className="flex-1" />
            <button onClick={testConnection} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon/10 text-theme-icon border border-theme-icon/20 hover:bg-theme-icon/20 transition-colors">
              Test
            </button>
            <button onClick={() => setShowConfig(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">
              Done
            </button>
          </div>
          {botInfo && (
            <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 rounded-lg px-3 py-2">
              <FaCheck className="w-3 h-3" /> Connected as @{botInfo.username}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { cmd: '/note Title', tip: '📝 Save a note — use #tags' },
          { cmd: '/bug Title', tip: '🐛 Log a bug' },
          { cmd: '/todo Task', tip: '✅ Add a task' },
          { cmd: '/snippet Title', tip: '📋 Save code snippet' },
          { cmd: '/list notes|bugs|...', tip: '📋 List by type' },
          { cmd: '/recent notes', tip: '📋 Recent items (filtered)' },
          { cmd: '/today', tip: '📋 Today\'s activity' },
          { cmd: '/weekly', tip: '📅 This week\'s stats' },
          { cmd: '/projects', tip: '📁 List projects' },
          { cmd: '/stats', tip: '📊 Full knowledge stats' },
          { cmd: '/undo', tip: '↩️ Delete last item' },
          { cmd: '/search q', tip: '🔍 Search knowledge' },
        ].map(x => (
          <div key={x.cmd} className="rounded-lg border border-theme-border/10 bg-theme-background/50 px-3 py-2">
            <code className="text-[10px] text-theme-icon font-mono">{x.cmd}</code>
            <p className="text-[9px] text-theme-text/35 mt-0.5">{x.tip}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-[200px] relative">
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
        <p className="text-[10px] text-theme-text/35 shrink-0">{updates.length} events</p>
        <button onClick={clearUpdates} disabled={!updates.length}
          className="inline-flex items-center gap-1 text-[10px] text-theme-text/30 hover:text-red-400 disabled:opacity-20 transition-colors">
          <FaTrash className="w-2.5 h-2.5" /> Clear
        </button>
      </div>

      {updates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-theme-border/20 py-12 text-center">
          <FaTelegram className="w-8 h-8 text-theme-text/15 mx-auto mb-3" />
          <p className="text-xs text-theme-text/35">No messages yet</p>
          <p className="text-[10px] text-theme-text/25 mt-1 max-w-sm mx-auto">
            Open your bot in Telegram, send /start, then come back — activity appears here automatically when polling is on.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-0.5">
          {updates
            .filter(u => !logFilter || u.text?.toLowerCase().includes(logFilter.toLowerCase()) || u.command?.toLowerCase().includes(logFilter.toLowerCase()) || u.result?.toLowerCase().includes(logFilter.toLowerCase()))
            .map((u, i) => (
            <div key={`${u.message_id}-${i}`} className="rounded-xl border border-theme-border/10 bg-theme-background/60 overflow-hidden">
              <div className="px-3 py-2 flex items-center gap-2 border-b border-theme-border/5">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-theme-icon/10 text-theme-icon">/{u.command || 'msg'}</span>
                <span className="text-[10px] text-theme-text/40 flex-1 truncate">{u.args || u.text.slice(0, 60)}</span>
                {u.created_id ? (
                  <Link to={KNOWLEDGE} className="text-[9px] text-green-400 hover:underline">Library #{u.created_id}</Link>
                ) : null}
              </div>
              <p className="px-3 py-2 text-[11px] text-theme-text/55 whitespace-pre-wrap">{u.result}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
