export type AiProvider = 'ollama' | 'lm-studio' | 'openai';

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface AiMessage {
  id: number;
  conversation_id: number;
  role: MessageRole;
  content: string;
  tool_calls: string;
  created_at: string;
}

export interface AiConversation {
  id: number;
  title: string;
  provider: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface AiConfig {
  provider: AiProvider;
  model: string;
  baseUrl: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const PROVIDER_DEFAULTS: Record<AiProvider, { baseUrl: string; model: string }> = {
  ollama: { baseUrl: 'http://localhost:11434', model: 'qwen2.5:7b' },
  'lm-studio': { baseUrl: 'http://localhost:1234/v1', model: 'qwen2.5-7b-instruct' },
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
};

export const PROVIDER_LABELS: Record<AiProvider, string> = {
  ollama: 'Ollama',
  'lm-studio': 'LM Studio',
  openai: 'OpenAI Compatible',
};
