import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { loadTelegramConfig, saveTelegramConfig, UPDATES_KEY } from './telegramConfig';
import { processTelegramUpdates, setBotCommands, type ProcessedUpdate } from './telegramBot';
import { tryTelegramAutoImport } from './telegramAutoImport';

function appendProcessedUpdates(processed: ProcessedUpdate[]) {
  if (!processed.length) return;
  try {
    const prev: ProcessedUpdate[] = JSON.parse(localStorage.getItem(UPDATES_KEY) || '[]');
    localStorage.setItem(UPDATES_KEY, JSON.stringify([...processed, ...prev].slice(0, 200)));
  } catch {
    localStorage.setItem(UPDATES_KEY, JSON.stringify(processed.slice(0, 200)));
  }
  try { window.dispatchEvent(new CustomEvent('telegram-updates')); } catch {}
}

export function TelegramPollingProvider({ children }: { children: React.ReactNode }) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intervalMsRef = useRef(0);
  const pollingRef = useRef(false);
  const commandsSetFor = useRef('');

  useEffect(() => {
    // Auto-import pending messages on startup
    tryTelegramAutoImport();

    const stop = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      intervalMsRef.current = 0;
    };

    const poll = async () => {
      if (pollingRef.current) return;
      const c = loadTelegramConfig();
      if (!c.bot_token || c.auto_poll === false) return;
      pollingRef.current = true;
      try {
        const offset = c.last_update_id ? c.last_update_id + 1 : 0;
        const res = await fetch(
          `https://api.telegram.org/bot${c.bot_token}/getUpdates?offset=${offset}&timeout=5`,
        );
        const data = await res.json();
        if (data.ok && data.result?.length) {
          const processed = await processTelegramUpdates(c.bot_token, c.chat_id, data.result);
          appendProcessedUpdates(processed);
          const maxId = Math.max(...data.result.map((u: any) => u.update_id));
          saveTelegramConfig({ ...loadTelegramConfig(), last_update_id: maxId });
        } else if (!data.ok) {
          console.warn('[Telegram] getUpdates failed:', data.description);
        }
      } catch (e) {
        console.warn('[Telegram] poll error:', e);
        toast.error('Telegram poll failed. Check your bot token.');
      } finally {
        pollingRef.current = false;
      }
    };

    const start = () => {
      const cfg = loadTelegramConfig();
      stop();
      // Poll whenever a token exists unless the user explicitly paused (auto_poll === false)
      if (!cfg.bot_token || cfg.auto_poll === false) return;

      const ms = Math.max(5, cfg.poll_interval || 15) * 1000;
      intervalMsRef.current = ms;

      if (commandsSetFor.current !== cfg.bot_token) {
        commandsSetFor.current = cfg.bot_token;
        setBotCommands(cfg.bot_token);
      }

      poll();
      intervalRef.current = setInterval(poll, ms);
    };

    // Always register listeners — token may be saved after first mount
    start();

    const onConfig = () => start();
    window.addEventListener('telegram-config', onConfig);
    window.addEventListener('storage', onConfig);

    const check = setInterval(() => {
      const cur = loadTelegramConfig();
      const wantMs =
        cur.bot_token && cur.auto_poll !== false
          ? Math.max(5, cur.poll_interval || 15) * 1000
          : 0;
      if (wantMs !== intervalMsRef.current) start();
    }, 3000);

    return () => {
      stop();
      clearInterval(check);
      window.removeEventListener('telegram-config', onConfig);
      window.removeEventListener('storage', onConfig);
    };
  }, []);

  return <>{children}</>;
}
