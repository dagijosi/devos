import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AiProvider, AiConfig } from '../types';
import { PROVIDER_DEFAULTS } from '../types';

interface AiState {
  config: AiConfig;
  sidebarOpen: boolean;
  setConfig: (config: Partial<AiConfig>) => void;
  setProvider: (provider: AiProvider) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAiStore = create<AiState>()(
  persist(
    (set) => ({
      config: {
        provider: 'lm-studio',
        model: PROVIDER_DEFAULTS['lm-studio'].model,
        baseUrl: PROVIDER_DEFAULTS['lm-studio'].baseUrl,
        apiKey: '',
        temperature: 0.7,
        maxTokens: 2048,
      },
      sidebarOpen: true,

      setConfig: (partial) =>
        set((state) => ({ config: { ...state.config, ...partial } })),

      setProvider: (provider) =>
        set((state) => ({
          config: {
            ...state.config,
            provider,
            baseUrl: PROVIDER_DEFAULTS[provider].baseUrl,
            model: PROVIDER_DEFAULTS[provider].model,
            apiKey: provider === 'openai' ? state.config.apiKey : '',
          },
        })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    { name: 'ai-store' }
  )
);
