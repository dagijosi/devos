import { useState, useCallback } from 'react';
import { FaPlay, FaCopy, FaTimes, FaPlus } from 'react-icons/fa';

interface HeaderEntry {
  key: string;
  value: string;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration: number;
}

export function ApiTester() {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<Method>('GET');
  const [headers, setHeaders] = useState<HeaderEntry[]>([{ key: '', value: '' }]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState('');

  const updateHeader = (idx: number, field: 'key' | 'value', val: string) => {
    setHeaders(prev => prev.map((h, i) => i === idx ? { ...h, [field]: val } : h));
  };

  const addHeader = () => setHeaders(prev => [...prev, { key: '', value: '' }]);
  const removeHeader = (idx: number) => setHeaders(prev => prev.filter((_, i) => i !== idx));

  const sendRequest = useCallback(async () => {
    if (!url.trim()) { setError('URL is required'); return; }
    setLoading(true);
    setError('');
    setResponse(null);

    const start = performance.now();
    try {
      const hdrs: Record<string, string> = {};
      headers.forEach(h => { if (h.key.trim()) hdrs[h.key.trim()] = h.value; });

      const res = await fetch(url, {
        method,
        headers: hdrs,
        body: ['POST', 'PUT', 'PATCH'].includes(method) ? body || undefined : undefined,
      });

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { resHeaders[k] = v; });

      const resBody = await res.text();
      const duration = Math.round(performance.now() - start);

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        body: resBody,
        duration,
      });
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [url, method, headers, body]);

  const copyResponse = () => {
    if (response) navigator.clipboard.writeText(response.body);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as Method)}
          className="bg-theme-background border border-theme-border/30 rounded-xl px-3 py-2 text-sm text-theme-text outline-none focus:border-theme-icon/50"
        >
          {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/endpoint"
          className="flex-1 bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50"
        />
        <button
          onClick={sendRequest}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors disabled:opacity-50"
        >
          <FaPlay className="w-3 h-3" />
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-theme-text/70">Headers</label>
          <button onClick={addHeader} className="text-xs text-theme-icon hover:underline flex items-center gap-1">
            <FaPlus className="w-2.5 h-2.5" /> Add
          </button>
        </div>
        <div className="space-y-2">
          {headers.map((h, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={h.key}
                onChange={(e) => updateHeader(i, 'key', e.target.value)}
                placeholder="Header name"
                className="flex-1 bg-theme-background border border-theme-border/30 rounded-lg px-3 py-1.5 text-xs text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50"
              />
              <input
                type="text"
                value={h.value}
                onChange={(e) => updateHeader(i, 'value', e.target.value)}
                placeholder="Value"
                className="flex-[2] bg-theme-background border border-theme-border/30 rounded-lg px-3 py-1.5 text-xs text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50"
              />
              {headers.length > 1 && (
                <button onClick={() => removeHeader(i)} className="p-1.5 text-theme-text/30 hover:text-red-400 transition-colors">
                  <FaTimes className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {['POST', 'PUT', 'PATCH'].includes(method) && (
        <div>
          <label className="text-sm font-medium text-theme-text/70 mb-1.5 block">Request Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder='{"key": "value"}'
            className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 font-mono resize-y"
          />
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {response && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                response.status < 300 ? 'bg-green-500/10 text-green-400' :
                response.status < 500 ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                {response.status} {response.statusText}
              </span>
              <span className="text-xs text-theme-text/40">{response.duration}ms</span>
            </div>
            <button onClick={copyResponse} className="flex items-center gap-1 text-xs text-theme-text/40 hover:text-theme-text/70 transition-colors">
              <FaCopy className="w-3 h-3" /> Copy
            </button>
          </div>
          <div className="bg-theme-background border border-theme-border/20 rounded-xl p-4 max-h-96 overflow-auto">
            <pre className="text-xs text-theme-text/80 font-mono whitespace-pre-wrap break-all">{response.body}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
