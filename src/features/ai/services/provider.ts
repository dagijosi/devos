import { httpFetch } from '../../../lib/http';
import type { AiConfig, ChatMessage } from '../types';

function buildHeaders(config: AiConfig): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.provider === 'openai' && config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }
  return headers;
}

async function* streamOllama(config: AiConfig, messages: ChatMessage[]): AsyncGenerator<string> {
  const url = `${config.baseUrl.replace(/\/+$/, '')}/api/chat`;
  const body = JSON.stringify({
    model: config.model,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    stream: true,
    options: { temperature: config.temperature },
  });

  const response = await httpFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  if (!response.ok) throw new Error(`Ollama error: ${response.status} ${await response.text()}`);

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.message?.content) yield parsed.message.content;
        if (parsed.done) return;
      } catch { /* skip partial */ }
    }
  }
}

async function* streamOpenAI(config: AiConfig, messages: ChatMessage[]): AsyncGenerator<string> {
  const url = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const body = JSON.stringify({
    model: config.model,
    messages,
    stream: true,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
  });

  const response = await httpFetch(url, { method: 'POST', headers: buildHeaders(config), body });
  if (!response.ok) throw new Error(`API error: ${response.status} ${await response.text()}`);

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content || '';
        if (content) yield content;
      } catch { /* skip partial */ }
    }
  }
}

export function streamChat(config: AiConfig, messages: ChatMessage[]): AsyncGenerator<string> {
  if (config.provider === 'ollama') return streamOllama(config, messages);
  return streamOpenAI(config, messages);
}
