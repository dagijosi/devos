import { useState } from 'react';

export function XmlFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const format = () => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(input, 'text/xml');
      const err = doc.querySelector('parsererror');
      if (err) throw new Error(err.textContent || 'Invalid XML');
      const serializer = new XMLSerializer();
      const formatted = serializer.serializeToString(doc);
      setOutput(formatted.replace(/></g, '>\n<').replace(/([^/])>\s*<\//g, '$1>\n</'));
      setError('');
    } catch (e: any) { setError(e.message); setOutput(''); }
  };

  const minify = () => {
    setOutput(input.replace(/>\s+</g, '><').trim());
    setError('');
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50";
  const ob = "px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors";

  return (
    <div className="space-y-4">
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={6} placeholder="<root><item>Hello</item></root>" className={ic} />
      <div className="flex gap-2">
        <button onClick={format} className={ob}>Format</button>
        <button onClick={minify} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-surface border border-theme-border/20 text-theme-text hover:bg-theme-border/10 transition-colors">Minify</button>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      {output && <textarea readOnly value={output} rows={6} className={ic} />}
    </div>
  );
}
