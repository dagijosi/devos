import { useState, useMemo } from 'react';

export function SvgPreview() {
  const [input, setInput] = useState('<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="#4F8EF7"/><rect x="30" y="30" width="40" height="40" fill="white" opacity="0.5"/></svg>');
  const [error, setError] = useState('');
  const blobUrl = useMemo(() => {
    try {
      const blob = new Blob([input], { type: 'image/svg+xml' });
      setError('');
      return URL.createObjectURL(blob);
    } catch { setError('Invalid SVG'); return ''; }
  }, [input]);

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50 font-mono";

  return (
    <div className="grid grid-cols-2 gap-4 h-[400px]">
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={16} placeholder="<svg>...</svg>" className={ic} />
      <div className="bg-white rounded-lg border border-theme-border/20 flex items-center justify-center p-4 overflow-hidden">
        {blobUrl && !error ? <img src={blobUrl} className="max-w-full max-h-full" /> : <p className="text-xs text-red-400">{error || 'Enter SVG code'}</p>}
      </div>
    </div>
  );
}
