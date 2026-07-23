import { useState } from 'react';

const DEMO_DATA = [
  { id: 1, name: 'Alice', role: 'Developer', salary: 95000 },
  { id: 2, name: 'Bob', role: 'Designer', salary: 85000 },
  { id: 3, name: 'Charlie', role: 'Manager', salary: 110000 },
];

function runQuery(sql: string): { columns: string[]; rows: string[][] } | string {
  const upp = sql.toUpperCase().trim();
  if (upp.startsWith('SELECT')) {
    const match = upp.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)/i);
    if (!match) return 'Unsupported query. Try: SELECT * FROM employees';
    const cols = match[1].trim();
    if (cols !== '*' && cols !== 'name, role' && cols !== 'name' && cols !== 'role' && cols !== 'salary' && cols !== 'name, salary') return 'SELECT column list not recognized';
    const table = match[2].toLowerCase();
    if (table !== 'employees') return 'Table not found: ' + table;
    let rows = DEMO_DATA;
    if (upp.includes('WHERE')) {
      const whereMatch = upp.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i);
      if (whereMatch) {
        const cond = whereMatch[1];
        if (cond.includes('salary >')) {
          const val = parseInt(cond.match(/(\d+)/)?.[1] || '0');
          rows = rows.filter(r => r.salary > val);
        } else if (cond.includes('name =')) {
          const name = cond.match(/'([^']+)'/)?.[1];
          if (name) rows = rows.filter(r => r.name === name);
        }
      }
    }
    if (upp.includes('ORDER BY')) {
      const orderMatch = upp.match(/ORDER BY\s+(\w+)(\s+(ASC|DESC))?/i);
      if (orderMatch) {
        const field = orderMatch[1].toLowerCase();
        const dir = orderMatch[3]?.toUpperCase() === 'DESC' ? -1 : 1;
        rows.sort((a, b) => dir * ((a as any)[field] > (b as any)[field] ? 1 : -1));
      }
    }
    if (upp.includes('LIMIT')) {
      const limit = parseInt(upp.match(/LIMIT\s+(\d+)/i)?.[1] || '100');
      rows = rows.slice(0, limit);
    }
    return { columns: Object.keys(DEMO_DATA[0]), rows: rows.map(r => Object.values(r).map(String)) };
  }
  return 'Only SELECT queries are supported in this demo.';
}

export function SqlRunner() {
  const [sql, setSql] = useState('');
  const [result, setResult] = useState<{ columns: string[]; rows: string[][] } | null>(null);
  const [error, setError] = useState('');

  const run = () => {
    setError('');
    const r = runQuery(sql);
    if (typeof r === 'string') { setError(r); setResult(null); }
    else { setResult(r); }
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50 font-mono";

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <textarea value={sql} onChange={e => setSql(e.target.value)} rows={4} placeholder="SELECT * FROM employees" className={`${ic} flex-1`} />
        <button onClick={run} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors self-start">Run</button>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      {result && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-theme-text border-collapse">
            <thead><tr>{result.columns.map((c, i) => <th key={i} className="border border-theme-border/20 px-3 py-2 bg-theme-background text-left font-medium">{c}</th>)}</tr></thead>
            <tbody>{result.rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j} className="border border-theme-border/20 px-3 py-1.5">{v}</td>)}</tr>)}</tbody>
          </table>
          <p className="text-[10px] text-theme-text/30 mt-2">{result.rows.length} rows returned</p>
        </div>
      )}
    </div>
  );
}
