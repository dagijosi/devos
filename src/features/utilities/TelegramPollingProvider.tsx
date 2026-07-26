import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { loadTelegramConfig, saveTelegramConfig, UPDATES_KEY } from './telegramConfig';
import { processTelegramUpdates, setBotCommands, type ProcessedUpdate } from './telegramBot';
import { tryTelegramAutoImport } from './telegramAutoImport';

/** Key we watch on the storage event — only restart polling when Telegram config changes. */
const TG_CONFIG_KEY = 'devos_telegram_config';

/** Show a toast only after this many consecutive poll failures to avoid spam. */
const FAILURE_TOAST_THRESHOLD = 3;

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
  const consecutiveFailures = useRef(0);

  useEffect(() => {
    // Defer auto-import by 2 s to allow App.tsx / database.initialize() to complete first.
    const autoImportTimer = setTimeout(() => {
      tryTelegramAutoImport();
    }, 2000);

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
        // Successful poll (or empty result) — reset failure counter.
        consecutiveFailures.current = 0;
      } catch (e) {
        consecutiveFailures.current += 1;
        console.warn('[Telegram] poll error:', e);
        // Only toast after several consecutive failures to avoid spamming on transient errors.
        if (consecutiveFailures.current >= FAILURE_TOAST_THRESHOLD) {
          toast.error('Telegram polling failed repeatedly. Check your bot token or network.');
          consecutiveFailures.current = 0; // Reset so we don't toast again immediately.
        }
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

    // Only restart the poll when the Telegram config key specifically changes — not on
    // every localStorage write from unrelated parts of the app.
    const onStorage = (e: StorageEvent) => {
      if (e.key === TG_CONFIG_KEY) start();
    };
    window.addEventListener('storage', onStorage);

    const check = setInterval(() => {
      const cur = loadTelegramConfig();
      const wantMs =
        cur.bot_token && cur.auto_poll !== false
          ? Math.max(5, cur.poll_interval || 15) * 1000
          : 0;
      if (wantMs !== intervalMsRef.current) start();
    }, 3000);

    return () => {
      clearTimeout(autoImportTimer);
      stop();
      clearInterval(check);
      window.removeEventListener('telegram-config', onConfig);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return <>{children}</>;
}
