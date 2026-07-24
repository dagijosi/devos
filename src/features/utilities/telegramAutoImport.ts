import { loadTelegramConfig, saveTelegramConfig } from './telegramConfig';
import { processTelegramUpdates } from './telegramBot';

const PROCESSED_KEY = 'devos_telegram_processed_ids';
const API = 'https://api.telegram.org/bot';

function getProcessedIds(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(PROCESSED_KEY) || '[]')); }
  catch { return new Set(); }
}

function saveProcessedIds(ids: number[]) {
  localStorage.setItem(PROCESSED_KEY, JSON.stringify([...new Set(ids)]));
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

    await processTelegramUpdates(config.bot_token, config.chat_id, unprocessed);

    const newIds = unprocessed.map((u: any) => u.message.message_id);
    saveProcessedIds([...processed, ...newIds]);
    const maxId = Math.max(...data.result.map((u: any) => u.update_id));
    config.last_update_id = maxId;
    saveTelegramConfig(config);
  } catch { /* silent fail */ }
}
