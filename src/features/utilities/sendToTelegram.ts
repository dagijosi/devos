import { loadTelegramConfig } from './telegramConfig';

const API = 'https://api.telegram.org/bot';

/**
 * Sends a message or code snippet directly to the connected Telegram chat.
 */
export async function sendToTelegram(text: string, title?: string): Promise<{ success: boolean; message?: string }> {
  const cfg = loadTelegramConfig();

  if (!cfg.bot_token) {
    return { success: false, message: 'Telegram bot token is not configured in DevOS.' };
  }

  if (!cfg.chat_id) {
    return { success: false, message: 'No Telegram Chat ID locked yet. Send /start to your bot first.' };
  }

  const formattedText = title
    ? `<b>${title}</b>\n\n<pre>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`
    : text;

  try {
    const res = await fetch(`${API}${cfg.bot_token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cfg.chat_id,
        text: formattedText,
        parse_mode: 'HTML',
      }),
    });

    const data = await res.json().catch(() => ({ ok: false, description: 'Invalid response' }));

    if (data.ok) {
      return { success: true };
    }

    // Fallback without HTML formatting if parsing fails
    const fallbackRes = await fetch(`${API}${cfg.bot_token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cfg.chat_id,
        text: title ? `${title}:\n\n${text}` : text,
      }),
    });

    const fallbackData = await fallbackRes.json().catch(() => ({ ok: false, description: 'Failed' }));
    if (fallbackData.ok) {
      return { success: true };
    }

    return { success: false, message: fallbackData.description || 'Failed to send message' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network error sending to Telegram' };
  }
}
