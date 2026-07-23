import { useState } from 'react';

export function FindReplace() {
  const [text, setText] = useState('');
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [result, setResult] = useState<{ text: string; count: number } | null>(null);

  const doFind = () => {
    if (!find) return;
    const flags = caseSensitive ? 'g' : 'gi';
    try {
      const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      const matches = text.match(regex);
      setResult({ text, count: matches ? matches.length : 0 });
    } catch { setResult({ text, count: 0 }); }
  };

  const doReplace = () => {
    if (!find) return;
    const flags = caseSensitive ? 'g' : 'gi';
    try {
      const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      const matches = text.match(regex);
      const newText = text.replace(regex, replace);
      setResult({ text: newText, count: matches ? matches.length : 0 });
    } catch { setResult(null); }
  };

  const doReplaceAll = () => {
    if (!find) return;
    const flags = caseSensitive ? 'g' : 'gi';
    try {
      const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      const matches = text.match(regex);
      const newText = text.replace(regex, replace);
      setText(newText);
      setResult({ text: newText, count: matches ? matches.length : 0 });
    } catch { setResult(null); }
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50 font-mono";

  return (
    <div className="space-y-4">
      <textarea value={text} onChange={e => setText(e.target.value)} rows={6} placeholder="Enter text..." className={ic} />
      <div className="flex gap-2">
        <input value={find} onChange={e => setFind(e.target.value)} placeholder="Find..." className={`${ic} flex-1`} />
        <input value={replace} onChange={e => setReplace(e.target.value)} placeholder="Replace with..." className={`${ic} flex-1`} />
      </div>
      <div className="flex gap-2 items-center">
        <label className="flex items-center gap-1.5 text-xs text-theme-text/40 cursor-pointer">
          <input type="checkbox" checked={caseSensitive} onChange={e => setCaseSensitive(e.target.checked)} className="accent-theme-icon" /> Case sensitive
        </label>
        <button onClick={doFind} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-surface border border-theme-border/20 text-theme-text hover:bg-theme-border/10 transition-colors">Find</button>
        <button onClick={doReplace} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon/10 text-theme-icon border border-theme-icon/20 hover:bg-theme-icon/20 transition-colors">Replace</button>
        <button onClick={doReplaceAll} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">Replace All</button>
      </div>
      {result && <p className={`text-[11px] ${result.count > 0 ? 'text-theme-text/60' : 'text-theme-text/30'}`}>Found {result.count} match{result.count !== 1 ? 'es' : ''}</p>}
      {result && result.text !== text && <textarea readOnly value={result.text} rows={6} className={ic} />}
    </div>
  );
}
