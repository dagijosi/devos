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
const CHAT_FILTER_MIGRATION_KEY = 'devos_tg_chat_filter_v1';

/** Telegram chat ids are integers (negative for groups/channels). Junk like "main" is ignored. */
export function normalizeChatFilter(raw: string | undefined | null): string {
  const t = String(raw ?? '').trim();
  if (!t) return '';
  return /^-?\d+$/.test(t) ? t : '';
}

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
    let dirty = false;

    // v1.1.9 stored auto_poll:false by default — turn polling back on once
    if (!localStorage.getItem(POLL_MIGRATION_KEY)) {
      merged.auto_poll = true;
      localStorage.setItem(POLL_MIGRATION_KEY, '1');
      dirty = true;
    }

    // Drop non-numeric chat filters (e.g. "main") that blocked every message
    if (!localStorage.getItem(CHAT_FILTER_MIGRATION_KEY) || merged.chat_id) {
      const cleaned = normalizeChatFilter(merged.chat_id);
      if (cleaned !== String(merged.chat_id ?? '').trim()) {
        merged.chat_id = cleaned;
        dirty = true;
      }
      localStorage.setItem(CHAT_FILTER_MIGRATION_KEY, '1');
    }

    if (dirty) localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return def;
  }
}

export function saveTelegramConfig(c: TelegramConfig) {
  const next = { ...c, chat_id: normalizeChatFilter(c.chat_id) };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  try { window.dispatchEvent(new CustomEvent('telegram-config')); } catch {}
}

export const UPDATES_KEY = 'devos_telegram_updates';
