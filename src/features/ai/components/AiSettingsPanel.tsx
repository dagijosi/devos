import { useState, useEffect, useCallback } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { useAiStore } from '../store/ai.store';
import { PROVIDER_LABELS, PROVIDER_DEFAULTS } from '../types';
import type { AiProvider } from '../types';
import Modal from '../../../components/ui/overlays/Modal';

interface AiSettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AiSettingsPanel({ open, onClose }: AiSettingsPanelProps) {
  const { config, setConfig, setProvider } = useAiStore();
  const [serverRunning, setServerRunning] = useState(false);
  const [checking, setChecking] = useState(false);
  const [toggling, setToggling] = useState(false);

  const checkServer = useCallback(async () => {
    setChecking(true);
    try {
      const url = config.baseUrl.replace(/\/+$/, '') + '/models';
      // Use no-cors to bypass CORS issues with local API servers (LM Studio / Ollama)
      const res = await fetch(url, { mode: 'no-cors', signal: AbortSignal.timeout(3000) });
      // In no-cors mode, opaque response (type='opaque', status=0) means the server answered
      setServerRunning(res.type === 'opaque' || res.ok);
    } catch {
      setServerRunning(false);
    }
    setChecking(false);
  }, [config.baseUrl]);

  useEffect(() => {
    if (open) checkServer();
  }, [open, checkServer]);

  const toggleServer = async () => {
    setToggling(true);
    const isTauri = typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;
    try {
      if (!serverRunning) {
        if (isTauri) {
          const { Command } = await import('@tauri-apps/plugin-shell');
          if (config.provider === 'lm-studio') {
            await Command.create('cmd', ['/c', 'start', '', '%LOCALAPPDATA%\\Programs\\LM Studio\\LM Studio.exe']).execute();
          } else if (config.provider === 'ollama') {
            await Command.create('cmd', ['/c', 'start', '', 'ollama', 'serve']).execute();
          }
        }
        setTimeout(checkServer, 5000);
      } else {
        if (isTauri) {
          const { Command } = await import('@tauri-apps/plugin-shell');
          if (config.provider === 'lm-studio') {
            await Command.create('taskkill', ['/f', '/im', 'lm-studio.exe']).execute();
          } else if (config.provider === 'ollama') {
            await Command.create('taskkill', ['/f', '/im', 'ollama.exe']).execute();
          }
        }
        setServerRunning(false);
      }
    } catch {}
    setToggling(false);
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="AI Settings" size="md"
      footer={
        <button onClick={onClose}
          className="px-5 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors">
          Done
        </button>
      }>
      <div className="space-y-4">
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

          {/* Local server toggle (LM Studio / Ollama) */}
          {config.provider !== 'openai' && (
            <div className={`rounded-xl p-3 border transition-colors ${serverRunning ? 'bg-green-500/5 border-green-500/20' : 'bg-theme-background border-theme-border/10'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${checking ? 'bg-yellow-400 animate-pulse' : serverRunning ? 'bg-green-400' : 'bg-red-400'}`} />
                  <div>
                    <span className="text-xs font-medium text-theme-text">
                      {checking ? 'Checking...' : serverRunning ? 'Qwen2.5 7B running' : 'Server off'}
                    </span>
                    {serverRunning && (
                      <p className="text-[9px] text-green-500/60">{config.baseUrl.replace(/\/+$/, '')}/models</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleServer}
                    disabled={toggling || checking}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      toggling ? 'opacity-50' :
                      serverRunning ? 'bg-green-500' : 'bg-theme-border/30'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                      serverRunning ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                  <button onClick={checkServer} disabled={checking}
                    className="text-[10px] text-theme-text/30 hover:text-theme-text/50 transition-colors disabled:opacity-50">
                    refresh
                  </button>
                </div>
              </div>
              {!serverRunning && (
                <p className="text-[10px] text-theme-text/40 flex items-start gap-1 mt-2">
                  <FaExclamationTriangle className="w-2.5 h-2.5 mt-0.5 shrink-0 text-yellow-400" />
                  <span>Toggle on to start LM Studio with Qwen2.5 7B</span>
                </p>
              )}
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
    </Modal>
  );
}
