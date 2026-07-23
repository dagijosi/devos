import { FaCog, FaTimes } from 'react-icons/fa';
import { useAiStore } from '../store/ai.store';
import { PROVIDER_LABELS, PROVIDER_DEFAULTS } from '../types';
import type { AiProvider } from '../types';

interface AiSettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AiSettingsPanel({ open, onClose }: AiSettingsPanelProps) {
  const { config, setConfig, setProvider } = useAiStore();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-theme-surface border border-theme-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme-border/30">
          <div className="flex items-center gap-2">
            <FaCog className="w-4 h-4 text-theme-icon" />
            <h3 className="text-sm font-semibold text-theme-text">AI Settings</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-theme-border/20 transition-colors">
            <FaTimes className="w-4 h-4 text-theme-text/50" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-theme-text/60 mb-1.5 block">Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PROVIDER_LABELS) as AiProvider[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    config.provider === p
                      ? 'bg-theme-icon/10 text-theme-icon border-theme-icon/40'
                      : 'bg-theme-background text-theme-text/50 border-theme-border/20 hover:border-theme-border/40'
                  }`}
                >
                  {PROVIDER_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-theme-text/60 mb-1.5 block">Base URL</label>
            <input
              type="text"
              value={config.baseUrl}
              onChange={(e) => setConfig({ baseUrl: e.target.value })}
              placeholder={PROVIDER_DEFAULTS[config.provider].baseUrl}
              className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 font-mono"
            />
            <p className="text-[10px] text-theme-text/30 mt-1">
              {config.provider === 'ollama' ? 'Default: http://localhost:11434' :
               config.provider === 'lm-studio' ? 'Default: http://localhost:1234/v1' :
               'e.g. https://api.openai.com/v1'}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-theme-text/60 mb-1.5 block">Model</label>
            <input
              type="text"
              value={config.model}
              onChange={(e) => setConfig({ model: e.target.value })}
              placeholder={PROVIDER_DEFAULTS[config.provider].model}
              className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 font-mono"
            />
          </div>

          {config.provider === 'openai' && (
            <div>
              <label className="text-xs font-medium text-theme-text/60 mb-1.5 block">API Key</label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig({ apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 font-mono"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-theme-text/60 mb-1.5 block">
              Temperature: {config.temperature.toFixed(1)}
            </label>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={config.temperature}
              onChange={(e) => setConfig({ temperature: parseFloat(e.target.value) })}
              className="w-full accent-theme-icon"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-theme-text/60 mb-1.5 block">Max Tokens: {config.maxTokens}</label>
            <input
              type="range"
              min={256}
              max={8192}
              step={256}
              value={config.maxTokens}
              onChange={(e) => setConfig({ maxTokens: parseInt(e.target.value) })}
              className="w-full accent-theme-icon"
            />
          </div>
        </div>

        <div className="px-5 py-3 border-t border-theme-border/30 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
