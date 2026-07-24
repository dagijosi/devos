export interface TelegramConfig {
  bot_token: string;
  chat_id: string;
  last_update_id: number;
  auto_poll: boolean;
  poll_interval: number;
}

const STORAGE_KEY = 'devos_telegram_config';

export function loadTelegramConfig(): TelegramConfig {
  const def: TelegramConfig = { bot_token: '', chat_id: '', last_update_id: 0, auto_poll: false, poll_interval: 15 };
  try { return { ...def, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return def; }
}

export function saveTelegramConfig(c: TelegramConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
}

export const UPDATES_KEY = 'devos_telegram_updates';
