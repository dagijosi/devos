import { useState } from 'react';

function yamlStringify(obj: any, indent = 0): string {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'string') return /[:\n#\[\]{}]/.test(obj) ? `"${obj}"` : obj;
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
  if (Array.isArray(obj)) return obj.map(v => `\n${'  '.repeat(indent)}- ${yamlStringify(v, indent + 1).trim()}`).join('');
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (!keys.length) return '{}';
    return keys.map(k => `\n${'  '.repeat(indent)}${k}: ${yamlStringify(obj[k], indent + 1).trim()}`).join('');
  }
  return String(obj);
}

export function YamlFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const format = () => {
    try {
      const parsed = Function('"use strict"; return (' + input + ')')();
      setOutput(yamlStringify(parsed, 0).trim());
      setError('');
    } catch (e: any) {
      try {
        const reviver = (_k: string, v: any) => { if (typeof v === 'string' && !isNaN(Number(v))) return v; return v; };
        const parsed = JSON.parse(input, reviver);
        setOutput(yamlStringify(parsed, 0).trim());
        setError('');
      } catch (e2: any) {
        setError('Invalid YAML/JSON: ' + e2.message);
        setOutput('');
      }
    }
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50";
  const ob = "px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors";

  return (
    <div className="space-y-4">
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={6} placeholder="name: John\nage: 30\nskills: [a, b]" className={ic} />
      <button onClick={format} className={ob}>Format</button>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      {output && <textarea readOnly value={output} rows={6} className={ic} />}
    </div>
  );
}
