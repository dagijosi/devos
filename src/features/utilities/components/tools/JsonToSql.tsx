import { useState } from 'react';

export function JsonToSql() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [tableName, setTableName] = useState('items');

  const convert = () => {
    try {
      const data = JSON.parse(input);
      const arr = Array.isArray(data) ? data : [data];
      if (!arr.length) { setOutput('-- Empty array'); return; }
      const keys = Object.keys(arr[0]);
      const cols = keys.map(k => `"${k}"`).join(', ');
      const vals = arr.map(obj => {
        const vs = keys.map(k => {
          const v = obj[k];
          if (v === null || v === undefined) return 'NULL';
          if (typeof v === 'number') return String(v);
          if (typeof v === 'boolean') return v ? '1' : '0';
          return `'${String(v).replace(/'/g, "''")}'`;
        });
        return `(${vs.join(', ')})`;
      }).join(',\n');
      setOutput(`INSERT INTO "${tableName}" (${cols})\nVALUES\n${vals};`);
    } catch (e: any) { setOutput('Error: ' + e.message); }
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50 font-mono";

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <label className="text-xs text-theme-text/60">Table: <input value={tableName} onChange={e => setTableName(e.target.value)} className="w-32 bg-theme-surface border border-theme-border/20 rounded-lg px-2 py-1 text-xs text-theme-text ml-1" /></label>
        <button onClick={convert} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">Convert</button>
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={6} placeholder='[{"name":"Alice","age":30}]' className={ic} />
      {output && <textarea readOnly value={output} rows={8} className={ic} />}
    </div>
  );
}
