import { useState } from 'react';

interface Column { name: string; type: string; pk?: boolean; fk?: string; nullable?: boolean; default?: string; }
interface TableSchema { name: string; columns: Column[]; }

export function SchemaViewer() {
  const [schema, setSchema] = useState<TableSchema[]>(() => [
    { name: 'users', columns: [{ name: 'id', type: 'INTEGER', pk: true }, { name: 'name', type: 'VARCHAR(255)', nullable: false }, { name: 'email', type: 'VARCHAR(255)' }, { name: 'created_at', type: 'TIMESTAMP', default: 'NOW()' }] },
    { name: 'posts', columns: [{ name: 'id', type: 'INTEGER', pk: true }, { name: 'title', type: 'VARCHAR(255)' }, { name: 'body', type: 'TEXT' }, { name: 'user_id', type: 'INTEGER', fk: 'users(id)' }, { name: 'created_at', type: 'TIMESTAMP', default: 'NOW()' }] },
    { name: 'comments', columns: [{ name: 'id', type: 'INTEGER', pk: true }, { name: 'post_id', type: 'INTEGER', fk: 'posts(id)' }, { name: 'content', type: 'TEXT' }, { name: 'author_id', type: 'INTEGER', fk: 'users(id)' }] },
  ]);

  const addTable = () => {
    setSchema(prev => [...prev, { name: 'new_table', columns: [{ name: 'id', type: 'INTEGER', pk: true }] }]);
  };

  return (
    <div className="space-y-6">
      <button onClick={addTable} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon/10 text-theme-icon border border-theme-icon/20 hover:bg-theme-icon/20 transition-colors">+ Add Table</button>
      <div className="space-y-4">
        {schema.map((table, ti) => (
          <div key={ti} className="bg-theme-background border border-theme-border/20 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-theme-surface border-b border-theme-border/10 flex items-center gap-2">
              <span className="text-xs font-semibold text-theme-text">📊 {table.name}</span>
              <span className="text-[10px] text-theme-text/30">{table.columns.length} columns</span>
            </div>
            <table className="w-full text-xs text-theme-text border-collapse">
              <thead><tr className="bg-theme-background/50"><th className="px-4 py-2 text-left font-medium text-theme-text/60">Column</th><th className="px-4 py-2 text-left font-medium text-theme-text/60">Type</th><th className="px-4 py-2 text-left font-medium text-theme-text/60">Constraints</th></tr></thead>
              <tbody>{table.columns.map((col, ci) => <tr key={ci} className="border-t border-theme-border/10"><td className="px-4 py-2 font-mono">{col.pk ? '🔑 ' : ''}{col.name}</td><td className="px-4 py-2 text-theme-text/60 font-mono">{col.type}</td><td className="px-4 py-2 text-theme-text/40">{col.fk ? `FK → ${col.fk}` : col.nullable === false ? 'NOT NULL' : col.default ? `DEFAULT ${col.default}` : '-'}</td></tr>)}</tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
