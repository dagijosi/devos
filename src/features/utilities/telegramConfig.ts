export interface TelegramConfig {
  bot_token: string;
  chat_id: string;
  last_update_id: number;
  /** false = user paused; otherwise poll when token is set */
  auto_poll: boolean;
  poll_interval: number;
}

const STORAGE_KEY = 'devos_telegram_config';
const POLL_MIGRATION_KEY = 'devos_tg_poll_migrated_v2';

export function loadTelegramConfig(): TelegramConfig {
  const def: TelegramConfig = {
    bot_token: '',
    chat_id: '',
    last_update_id: 0,
    auto_poll: true,
    poll_interval: 15,
  };
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Partial<TelegramConfig>;
    const merged = { ...def, ...raw };

    // v1.1.9 stored auto_poll:false by default — turn polling back on once
    if (!localStorage.getItem(POLL_MIGRATION_KEY)) {
      merged.auto_poll = true;
      localStorage.setItem(POLL_MIGRATION_KEY, '1');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }

    return merged;
  } catch {
    return def;
  }
}

export function saveTelegramConfig(c: TelegramConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  try { window.dispatchEvent(new CustomEvent('telegram-config')); } catch {}
}

export const UPDATES_KEY = 'devos_telegram_updates';
