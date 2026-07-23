import { useState } from 'react';

export function TokenInspector() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState<{ type: string; parts: Record<string, any> } | null>(null);
  const [error, setError] = useState('');

  const inspect = () => {
    setError(''); setResult(null);
    const t = token.trim();
    // JWT
    if (t.split('.').length === 3) {
      try {
        const parts = t.split('.');
        const header = JSON.parse(atob(parts[0]));
        const payload = JSON.parse(atob(parts[1]));
        setResult({ type: 'JWT', parts: { header, payload, signature: parts[2].slice(0, 20) + '...' } });
        return;
      } catch {}
    }
    // Bearer
    if (t.length > 20) {
      const clean = t.replace(/^Bearer\s+/i, '');
      setResult({ type: 'Bearer Token', parts: { length: clean.length, prefix: clean.slice(0, 20) + '...', estimated: clean.length > 40 ? 'Access Token (likely opaque or JWT)' : 'Short token' } });
      return;
    }
    setError('Unrecognized token format. Try a JWT or Bearer token.');
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50 font-mono";

  return (
    <div className="space-y-4">
      <textarea value={token} onChange={e => setToken(e.target.value)} rows={4} placeholder="Paste a JWT or Bearer token..." className={ic} />
      <button onClick={inspect} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">Inspect</button>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      {result && (
        <div className="bg-theme-background border border-theme-border/20 rounded-xl p-4 space-y-3">
          <p className="text-xs font-medium text-theme-text">Type: <span className="text-theme-icon">{result.type}</span></p>
          {Object.entries(result.parts).map(([k, v]) => (
            <div key={k}>
              <p className="text-[10px] text-theme-text/40 uppercase tracking-wider mb-1">{k}</p>
              <pre className="text-xs text-theme-text font-mono bg-theme-surface rounded-lg p-2 overflow-x-auto">{typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
