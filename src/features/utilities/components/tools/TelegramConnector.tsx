import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { FaTelegram, FaSync, FaTrash, FaCog, FaRobot, FaCheck } from 'react-icons/fa';
import { loadTelegramConfig, saveTelegramConfig, UPDATES_KEY, type TelegramConfig } from '../../telegramConfig';
import { processTelegramUpdates, setBotCommands, type ProcessedUpdate } from '../../telegramBot';

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

  const save = useCallback((patch: Partial<TelegramConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    saveTelegramConfig(next);
  }, [config]);

  useEffect(() => {
    if (!config.bot_token || botInfo) return;
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
  }, []);

  useEffect(() => { saveUpdates(updates); }, [updates]);

  const testConnection = async () => {
    if (!config.bot_token) { toast.error('Enter bot token first'); return; }
    try {
      const res = await fetch(`${API}${config.bot_token}/getMe`);
      const data = await res.json();
      if (data.ok) {
        setBotInfo({ username: data.result.username, name: data.result.first_name });
        const cmdsOk = await setBotCommands(config.bot_token);
        toast.success(`Connected as @${data.result.username}${cmdsOk ? ' · Commands registered' : ''}`);
      } else {
        toast.error(`Telegram API: ${data.description}`);
      }
    } catch { toast.error('Connection failed'); }
  };

  const fetchAndProcess = async () => {
    if (!config.bot_token) { toast.error('Configure bot token first'); return; }
    setLoading(true);
    try {
      const offset = config.last_update_id ? config.last_update_id + 1 : 0;
      const res = await fetch(`${API}${config.bot_token}/getUpdates?offset=${offset}&timeout=10`);
      const data = await res.json();
      if (!data.ok) { toast.error(`API: ${data.description}`); setLoading(false); return; }
      if (!data.result?.length) { toast('No new messages'); setLoading(false); return; }

      const processed = await processTelegramUpdates(config.bot_token, config.chat_id, data.result);
      setUpdates(prev => [...processed, ...prev]);

      const maxId = Math.max(...data.result.map((u: any) => u.update_id));
      save({ last_update_id: maxId });

      const byCmd = processed.reduce((acc, u) => { acc[u.command] = (acc[u.command] || 0) + 1; return acc; }, {} as Record<string, number>);
      const summary = Object.entries(byCmd).map(([c, n]) => `${n}× /${c}`).join(', ');
      toast.success(`Processed ${processed.length} message${processed.length !== 1 ? 's' : ''}: ${summary}`);
    } catch (e: any) { toast.error(`Error: ${e.message}`); }
    setLoading(false);
  };

  const clearUpdates = () => setUpdates([]);

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50";

  return (
    <div className="space-y-4">
      {showConfig && (
        <div className="bg-theme-background border border-theme-border/20 rounded-xl p-4 space-y-3">
          <p className="text-xs font-medium text-theme-text">🤖 Telegram Bot Configuration</p>
          <p className="text-[10px] text-theme-text/40">
            Create a bot via <a href="https://t.me/BotFather" target="_blank" className="text-theme-icon underline">@BotFather</a>, then enter its token here.
            Send commands from your phone and this tool processes them into your DevOS database.
          </p>
          <input value={config.bot_token} onChange={e => save({ bot_token: e.target.value })} placeholder="Bot token: 123456:ABCdef..." className={ic} />
          <input value={config.chat_id} onChange={e => save({ chat_id: e.target.value })} placeholder="Chat ID (optional — only process messages from this chat)" className={ic} />

          {botInfo && (
            <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 rounded-lg px-3 py-2">
              <FaCheck className="w-3 h-3" /> Connected as @{botInfo.username} ({botInfo.name})
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={testConnection} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon/10 text-theme-icon border border-theme-icon/20 hover:bg-theme-icon/20 transition-colors">Test Connection</button>
            <button onClick={() => setShowConfig(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">Save</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FaTelegram className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-theme-text/60 font-medium">Telegram Bot</span>
          {botInfo && <span className="text-[10px] text-green-400">● @{botInfo.username}</span>}
          {!showConfig && (
            <button onClick={() => setShowConfig(true)} className="p-1 rounded text-theme-text/30 hover:text-theme-text"><FaCog className="w-3 h-3" /></button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <select value={config.poll_interval || 15} onChange={e => save({ poll_interval: Number(e.target.value) })}
            className="bg-theme-surface border border-theme-border/20 rounded-lg px-1.5 py-1.5 text-[10px] text-theme-text/50 outline-none cursor-pointer">
            <option value={5}>5s</option>
            <option value={10}>10s</option>
            <option value={15}>15s</option>
            <option value={30}>30s</option>
            <option value={60}>60s</option>
            <option value={120}>120s</option>
          </select>
          <span className="text-[10px] text-theme-text/20">|</span>
          <button onClick={fetchAndProcess} disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 disabled:opacity-50 transition-colors">
            <FaSync className={`w-2.5 h-2.5 ${loading ? 'animate-spin' : ''}`} /> Fetch
          </button>
          <button onClick={clearUpdates} disabled={!updates.length}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-theme-surface border border-theme-border/20 text-theme-text/60 hover:text-red-400 disabled:opacity-30 transition-colors">
            <FaTrash className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-theme-text/30">
        <span>Commands: /note, /bug, /todo, /snippet, /search, /recent, /help</span>
        <span className="text-theme-text/20">·</span>
        <span>Plain text → note</span>
      </div>

      {updates.length === 0 && !loading && (
        <div className="text-center py-10">
          <FaRobot className="w-10 h-10 text-theme-text/15 mx-auto mb-3" />
          <p className="text-xs text-theme-text/25">Send a command to your bot on Telegram — it will be auto-fetched.</p>
          <div className="mt-4 max-w-md mx-auto text-left space-y-1.5 text-[10px] text-theme-text/30">
            <p className="font-medium text-theme-text/40">Example:</p>
            <code className="block px-3 py-1.5 bg-theme-background rounded-lg">/note My Meeting Notes</code>
            <code className="block px-3 py-1.5 bg-theme-background rounded-lg">Discussed Q3 roadmap with the team</code>
            <code className="block px-3 py-1.5 bg-theme-background rounded-lg">Action items: deploy v2 by Friday</code>
          </div>
        </div>
      )}

      {updates.length > 0 && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {updates.map((u, i) => (
            <div key={`${u.message_id}-${i}`} className="bg-theme-background border border-theme-border/10 rounded-xl overflow-hidden">
              <div className="px-3 py-2 flex items-center gap-2 border-b border-theme-border/5">
                <span className="text-[10px] font-mono text-theme-text/30">#{u.message_id}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-theme-icon/10 text-theme-icon">/{u.command}</span>
                <span className="text-[9px] text-theme-text/30 flex-1 truncate">{u.args || u.text.slice(0, 40)}</span>
                {u.created_id && <span className="text-[9px] text-green-400">ID: {u.created_id}</span>}
              </div>
              <div className="px-3 py-2 flex items-start gap-2">
                <FaRobot className="w-3 h-3 text-theme-icon/50 mt-0.5 shrink-0" />
                <p className="text-[11px] text-theme-text/60 whitespace-pre-wrap">{u.result}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
