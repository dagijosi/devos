import { useState } from 'react';
import { FaPlay, FaPlus, FaTrash, FaCode, FaKey } from 'react-icons/fa';
import type { ApiRequestConfig, HttpMethod } from '../types';
import { DEFAULT_REQUEST_CONFIG } from '../types';

interface Props {
  onExecute: (config: ApiRequestConfig) => void;
  loading: boolean;
}

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export function ApiRequestForm({ onExecute, loading }: Props) {
  const [config, setConfig] = useState<ApiRequestConfig>({ ...DEFAULT_REQUEST_CONFIG });
  const [showAuth, setShowAuth] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);
  const [showParams, setShowParams] = useState(false);
  const [showBody, setShowBody] = useState(false);

  const update = <K extends keyof ApiRequestConfig>(key: K, val: ApiRequestConfig[K]) => setConfig(prev => ({ ...prev, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.url.trim()) return;
    onExecute(config);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <select value={config.method} onChange={e => update('method', e.target.value as HttpMethod)}
          className="w-24 bg-theme-background border border-theme-border/30 rounded-lg px-2 py-2 text-xs font-mono text-theme-text outline-none focus:border-theme-icon/50">
          {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <input type="text" value={config.url} onChange={e => update('url', e.target.value)}
          placeholder="https://api.example.com/users"
          className="flex-1 bg-theme-background border border-theme-border/30 rounded-lg px-3 py-2 text-xs font-mono text-theme-text outline-none focus:border-theme-icon/50 placeholder:text-theme-text/20" />
        <button type="submit" disabled={loading || !config.url.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-theme-icon text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-40 transition-opacity">
          <FaPlay className="w-2.5 h-2.5" /> {loading ? 'Sending...' : 'Send'}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <ToggleChip active={showAuth} onClick={() => setShowAuth(!showAuth)} icon={<FaKey className="w-2.5 h-2.5" />} label="Auth" />
        <ToggleChip active={showHeaders} onClick={() => setShowHeaders(!showHeaders)} icon={<FaCode className="w-2.5 h-2.5" />} label="Headers" />
        <ToggleChip active={showParams} onClick={() => setShowParams(!showParams)} icon={<FaCode className="w-2.5 h-2.5" />} label="Query Params" />
        <ToggleChip active={showBody} onClick={() => setShowBody(!showBody)} icon={<FaCode className="w-2.5 h-2.5" />} label="Body" />
      </div>

      {showAuth && (
        <div className="bg-theme-surface border border-theme-border/20 rounded-xl p-3 space-y-3">
          <select value={config.authType} onChange={e => update('authType', e.target.value as ApiRequestConfig['authType'])}
            className="w-full bg-theme-background border border-theme-border/30 rounded-lg px-3 py-2 text-xs text-theme-text outline-none">
            <option value="none">No Auth</option>
            <option value="bearer">Bearer Token</option>
            <option value="api-key">API Key</option>
            <option value="basic">Basic Auth</option>
          </select>
          {config.authType === 'bearer' && (
            <input type="password" value={config.authToken} onChange={e => update('authToken', e.target.value)}
              placeholder="Bearer token..." className="w-full bg-theme-background border border-theme-border/30 rounded-lg px-3 py-2 text-xs font-mono text-theme-text outline-none" />
          )}
          {config.authType === 'api-key' && (
            <div className="flex gap-2">
              <input type="text" value={config.apiKeyHeader} onChange={e => update('apiKeyHeader', e.target.value)}
                placeholder="Header name" className="flex-1 bg-theme-background border border-theme-border/30 rounded-lg px-3 py-2 text-xs font-mono text-theme-text outline-none" />
              <input type="password" value={config.apiKeyValue} onChange={e => update('apiKeyValue', e.target.value)}
                placeholder="Value" className="flex-1 bg-theme-background border border-theme-border/30 rounded-lg px-3 py-2 text-xs font-mono text-theme-text outline-none" />
            </div>
          )}
          {config.authType === 'basic' && (
            <div className="flex gap-2">
              <input type="text" value={config.basicUsername} onChange={e => update('basicUsername', e.target.value)}
                placeholder="Username" className="flex-1 bg-theme-background border border-theme-border/30 rounded-lg px-3 py-2 text-xs font-mono text-theme-text outline-none" />
              <input type="password" value={config.basicPassword} onChange={e => update('basicPassword', e.target.value)}
                placeholder="Password" className="flex-1 bg-theme-background border border-theme-border/30 rounded-lg px-3 py-2 text-xs font-mono text-theme-text outline-none" />
            </div>
          )}
        </div>
      )}

      {showHeaders && <KeyValueList values={config.headers} onChange={v => update('headers', v)} keyPlaceholder="Header" valPlaceholder="Value" />}
      {showParams && <KeyValueList values={config.queryParams} onChange={v => update('queryParams', v)} keyPlaceholder="Param" valPlaceholder="Value" />}

      {showBody && (
        <div className="bg-theme-surface border border-theme-border/20 rounded-xl p-3 space-y-2">
          <select value={config.bodyType} onChange={e => update('bodyType', e.target.value as ApiRequestConfig['bodyType'])}
            className="w-full bg-theme-background border border-theme-border/30 rounded-lg px-3 py-2 text-xs text-theme-text outline-none">
            <option value="json">JSON</option>
            <option value="form-data">Form Data</option>
            <option value="none">None</option>
          </select>
          {config.bodyType !== 'none' && (
            <textarea value={config.body} onChange={e => update('body', e.target.value)}
              placeholder={config.bodyType === 'json' ? '{\n  "key": "value"\n}' : 'key=value&key2=value2'}
              rows={6}
              className="w-full bg-theme-background border border-theme-border/30 rounded-lg px-3 py-2 text-xs font-mono text-theme-text outline-none resize-y placeholder:text-theme-text/20" />
          )}
        </div>
      )}
    </form>
  );
}

function ToggleChip({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
        active ? 'bg-theme-icon/10 text-theme-icon border border-theme-icon/30' : 'bg-theme-background text-theme-text/40 border border-theme-border/10 hover:border-theme-border/30'
      }`}>
      {icon} {label}
    </button>
  );
}

function KeyValueList({ values, onChange, keyPlaceholder, valPlaceholder }: {
  values: { key: string; value: string }[];
  onChange: (v: { key: string; value: string }[]) => void;
  keyPlaceholder: string;
  valPlaceholder: string;
}) {
  const add = () => onChange([...values, { key: '', value: '' }]);
  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));
  const update = (i: number, field: 'key' | 'value', val: string) => {
    const next = [...values];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };

  return (
    <div className="bg-theme-surface border border-theme-border/20 rounded-xl p-3 space-y-2">
      {values.map((v, i) => (
        <div key={i} className="flex gap-2">
          <input type="text" value={v.key} onChange={e => update(i, 'key', e.target.value)}
            placeholder={keyPlaceholder} className="flex-1 bg-theme-background border border-theme-border/30 rounded-lg px-3 py-1.5 text-xs font-mono text-theme-text outline-none" />
          <input type="text" value={v.value} onChange={e => update(i, 'value', e.target.value)}
            placeholder={valPlaceholder} className="flex-1 bg-theme-background border border-theme-border/30 rounded-lg px-3 py-1.5 text-xs font-mono text-theme-text outline-none" />
          <button type="button" onClick={() => remove(i)} className="p-1.5 text-theme-text/30 hover:text-red-400 transition-colors">
            <FaTrash className="w-2.5 h-2.5" />
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1 text-xs text-theme-icon/70 hover:text-theme-icon transition-colors">
        <FaPlus className="w-2 h-2" /> Add
      </button>
    </div>
  );
}
