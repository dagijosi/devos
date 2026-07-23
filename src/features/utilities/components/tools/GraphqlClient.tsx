import { useState } from 'react';

export function GraphqlClient() {
  const [url, setUrl] = useState('');
  const [query, setQuery] = useState('');
  const [headers, setHeaders] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    if (!url || !query) return;
    setLoading(true); setError(''); setResponse('');
    try {
      const hdrs: Record<string, string> = { 'Content-Type': 'application/json' };
      if (headers.trim()) {
        headers.split('\n').forEach(l => { const [k, ...v] = l.split(':'); if (k && v.length) hdrs[k.trim()] = v.join(':').trim(); });
      }
      const res = await fetch(url, { method: 'POST', headers: hdrs, body: JSON.stringify({ query }) });
      setResponse(JSON.stringify(await res.json(), null, 2));
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50 font-mono";

  return (
    <div className="space-y-4">
      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://api.example.com/graphql" className={ic} />
      <textarea value={query} onChange={e => setQuery(e.target.value)} rows={5} placeholder="{ users { id name } }" className={ic} />
      <textarea value={headers} onChange={e => setHeaders(e.target.value)} rows={2} placeholder="Authorization: Bearer xxx" className={ic} />
      <button onClick={send} disabled={loading} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 disabled:opacity-50 transition-colors">{loading ? 'Sending...' : 'Send Query'}</button>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      {response && <textarea readOnly value={response} rows={8} className={ic} />}
    </div>
  );
}
