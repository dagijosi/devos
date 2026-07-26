import { loadTelegramConfig, saveTelegramConfig, UPDATES_KEY } from './telegramConfig';
import { processTelegramUpdates, DEDUP_KEY, type ProcessedUpdate } from './telegramBot';

const API = 'https://api.telegram.org/bot';

function getProcessedIds(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(DEDUP_KEY) || '[]')); }
  catch { return new Set(); }
}

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

export async function tryTelegramAutoImport() {
  const config = loadTelegramConfig();
  if (!config.bot_token) return;

  try {
    const processed = getProcessedIds();
    const offset = config.last_update_id ? config.last_update_id + 1 : 0;
    const res = await fetch(`${API}${config.bot_token}/getUpdates?offset=${offset}&timeout=5`);
    const data = await res.json();
    if (!data.ok || !data.result?.length) return;

    const unprocessed = data.result.filter((u: any) => {
      const mid = u.message?.message_id;
      return mid && !processed.has(mid);
    });
    if (!unprocessed.length) return;

    // processTelegramUpdates internally calls markProcessed for each message_id.
    const results = await processTelegramUpdates(config.bot_token, config.chat_id, unprocessed);

    // Append to activity log so the UI reflects startup-imported messages.
    appendProcessedUpdates(results);

    const maxId = Math.max(...data.result.map((u: any) => u.update_id));
    saveTelegramConfig({ ...config, last_update_id: maxId });
  } catch { /* silent fail */ }
}
