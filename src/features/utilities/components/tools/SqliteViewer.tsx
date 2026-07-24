import { useState, useRef } from 'react';

export function SqliteViewer() {
  const [rows, setRows] = useState<string[][]>([]);
  const [cols, setCols] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith('.db') && !file.name.endsWith('.sqlite')) return;
    setLoading(true); setError('');
    try {
      const SQL = await (window as any).initSqlJs?.();
      if (!SQL) { setError('sql.js not loaded. Install sql.js package.'); return; }
      const buf = await file.arrayBuffer();
      const db = new SQL.Database(new Uint8Array(buf));
      const tables: string[][] = [];
      const tableResult = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
      for (const t of tableResult) {
        const name = t.values[0][0];
        tables.push([name]);
        const data = db.exec(`SELECT * FROM "${name}" LIMIT 100`);
        if (data.length) {
          setCols(data[0].columns);
          setRows(prev => [...prev, ...data[0].values.map((v: any) => v.map(String))]);
        }
      }
      db.close();
      setCols(prev => [...prev]);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none";
  void ic;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <input ref={inputRef} type="file" accept=".db,.sqlite" onChange={loadFile} className="hidden" />
        <button onClick={() => inputRef.current?.click()} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">Open SQLite File</button>
        <span className="text-xs text-theme-text/40">{loading ? 'Loading...' : '.db or .sqlite files'}</span>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      {cols.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-theme-text border-collapse">
            <thead><tr>{cols.map((c, i) => <th key={i} className="border border-theme-border/20 px-3 py-2 bg-theme-background text-left font-medium">{c}</th>)}</tr></thead>
            <tbody>{rows.slice(0, 100).map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j} className="border border-theme-border/20 px-3 py-1.5">{v}</td>)}</tr>)}</tbody>
          </table>
          <p className="text-[10px] text-theme-text/30 mt-2">Showing first 100 rows</p>
        </div>
      )}
      {cols.length === 0 && !loading && <p className="text-xs text-theme-text/30 text-center py-8">Open a .db or .sqlite file to view its contents</p>}
    </div>
  );
}
