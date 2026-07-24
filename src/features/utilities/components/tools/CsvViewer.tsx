import { useState } from 'react';

export function CsvViewer() {
  const [input, setInput] = useState('');
  const [delimiter, setDelimiter] = useState(',');
  const [error] = useState('');
  void error;

  const lines = input.trim() ? input.trim().split('\n') : [];
  const headers = lines.length > 0 ? lines[0].split(delimiter).map(h => h.trim()) : [];
  const rows = lines.slice(1).map(l => l.split(delimiter).map(c => c.trim()));

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50 font-mono";

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <label className="text-xs text-theme-text/60">Delimiter: <input value={delimiter} onChange={e => setDelimiter(e.target.value)} maxLength={1} className="w-8 bg-theme-surface border border-theme-border/20 rounded-lg px-2 py-1 text-xs text-theme-text ml-1 text-center" /></label>
        <span className="text-[10px] text-theme-text/30">{rows.length} rows, {headers.length} columns</span>
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={6} placeholder="name,age,city\nAlice,30,NYC\nBob,25,LA" className={ic} />
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      {headers.length > 0 && (
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full text-xs text-theme-text border-collapse">
            <thead><tr>{headers.map((h, i) => <th key={i} className="border border-theme-border/20 px-3 py-2 bg-theme-background text-left font-medium sticky top-0">{h}</th>)}</tr></thead>
            <tbody>{rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j} className="border border-theme-border/20 px-3 py-1.5">{v}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
