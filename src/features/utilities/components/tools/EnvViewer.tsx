import { useState } from 'react';
import { getProjectContext } from '../../../projects/utils/projectContext';

export function EnvViewer() {
  const project = getProjectContext();
  const envPath = project?.localPath ? `${project.localPath}\\.env` : '';
  const [input, setInput] = useState('DATABASE_URL=postgres://localhost:5432/mydb\nAPI_KEY=sk-abc123\nNODE_ENV=development\nPORT=3000\nDEBUG=true');
  const [parsed, setParsed] = useState<{ key: string; value: string }[]>([]);
  const [mask, setMask] = useState(true);

  const parse = () => {
    const lines = input.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
    const vars = lines.map(l => {
      const eq = l.indexOf('=');
      return eq > 0 ? { key: l.slice(0, eq).trim(), value: l.slice(eq + 1).trim() } : { key: l.trim(), value: '' };
    });
    setParsed(vars);
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50 font-mono";

  return (
    <div className="space-y-4">
      {envPath && (
        <div className="flex items-center gap-2 text-[10px] text-theme-text/40 px-1">
          <span className="font-mono truncate" title={envPath}>{envPath}</span>
        </div>
      )}
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={6} placeholder="KEY=VALUE" className={ic} />
      <button onClick={parse} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">Parse</button>
      {parsed.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-theme-text/40 cursor-pointer">
              <input type="checkbox" checked={mask} onChange={e => setMask(e.target.checked)} className="accent-theme-icon" /> Mask secret values
            </label>
            <span className="text-[10px] text-theme-text/30">{parsed.length} variables</span>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {parsed.map((v, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 bg-theme-background rounded-lg text-xs group">
                <code className="text-theme-icon font-mono w-40 shrink-0">{v.key}</code>
                <code className="text-theme-text/60 font-mono flex-1 truncate">{mask && ['KEY', 'SECRET', 'TOKEN', 'PASSWORD', 'API'].some(k => v.key.toUpperCase().includes(k)) ? '********' : v.value}</code>
                <button onClick={() => navigator.clipboard.writeText(`${v.key}=${v.value}`)} className="text-[10px] opacity-0 group-hover:opacity-100 text-theme-icon hover:underline transition-opacity shrink-0">Copy</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
