import { useEffect, useRef } from 'react';
import { loadTelegramConfig } from './telegramConfig';
import { processTelegramUpdates, setBotCommands } from './telegramBot';

export function TelegramPollingProvider({ children }: { children: React.ReactNode }) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const cfg = loadTelegramConfig();
    if (!cfg.bot_token) return;

    // Register commands once on mount
    setBotCommands(cfg.bot_token);

    const poll = async () => {
      const c = loadTelegramConfig();
      if (!c.bot_token) return;
      try {
        const offset = c.last_update_id ? c.last_update_id + 1 : 0;
        const res = await fetch(`https://api.telegram.org/bot${c.bot_token}/getUpdates?offset=${offset}&timeout=5`);
        const data = await res.json();
        if (data.ok && data.result?.length) {
          await processTelegramUpdates(c.bot_token, c.chat_id, data.result);
          const maxId = Math.max(...data.result.map((u: any) => u.update_id));
          const updated = { ...c, last_update_id: maxId };
          localStorage.setItem('devos_telegram_config', JSON.stringify(updated));
        }
      } catch { /* network error — retry next cycle */ }
    };

    const start = () => {
      const cfg2 = loadTelegramConfig();
      if (!cfg2.bot_token) return;
      const ms = (cfg2.poll_interval || 15) * 1000;
      poll(); // immediate first poll
      intervalRef.current = setInterval(poll, ms);
    };

    start();

    // Watch for config changes (poll_interval changes, etc)
    const check = setInterval(() => {
      const cur = loadTelegramConfig();
      const curMs = (cur.poll_interval || 15) * 1000;
      if (intervalRef.current) {
        const existingMs = (intervalRef.current as any)._repeat || curMs;
        if (existingMs !== curMs || !cur.bot_token) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          if (cur.bot_token) start();
        }
      } else if (cur.bot_token) {
        start();
      }
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearInterval(check);
    };
  }, []);

  return <>{children}</>;
}
