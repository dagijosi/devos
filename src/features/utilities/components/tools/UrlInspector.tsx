import { useState } from 'react';

export function UrlInspector() {
  const [input, setInput] = useState('https://www.example.com:8080/path/to/page?name=value&key=val#section');
  const [parts, setParts] = useState<{ label: string; value: string }[]>([]);

  const parse = () => {
    try {
      const u = new URL(input);
      setParts([
        { label: 'Protocol', value: u.protocol.replace(':', '') },
        { label: 'Hostname', value: u.hostname },
        { label: 'Port', value: u.port || '(default)' },
        { label: 'Host', value: u.host },
        { label: 'Pathname', value: u.pathname },
        { label: 'Search / Query', value: u.search || '(none)' },
        { label: 'Hash', value: u.hash || '(none)' },
        { label: 'Origin', value: u.origin },
        { label: 'Username', value: u.username || '(none)' },
        { label: 'Password', value: u.password || '(none)' },
      ]);
    } catch { setParts([{ label: 'Error', value: 'Invalid URL' }]); }
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50";

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="https://..." className={`${ic} flex-1`} />
        <button onClick={parse} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">Parse</button>
      </div>
      {parts.length > 0 && (
        <div className="bg-theme-background border border-theme-border/20 rounded-xl overflow-hidden">
          {parts.map((p, i) => (
            <div key={i} className={`flex justify-between items-center px-4 py-2 text-xs ${i % 2 === 0 ? 'bg-theme-surface/50' : ''}`}>
              <span className="text-theme-text/60 font-medium">{p.label}</span>
              <code className="text-theme-text font-mono text-right">{p.value}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
