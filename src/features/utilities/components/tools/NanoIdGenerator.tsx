import { useState } from 'react';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-';

function nanoId(size: number): string {
  const arr = new Uint8Array(size);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => ALPHABET[b % 64]).join('');
}

export function NanoIdGenerator() {
  const [count, setCount] = useState(5);
  const [length, setLength] = useState(21);
  const [ids, setIds] = useState<string[]>([]);

  const generate = () => {
    setIds(Array.from({ length: count }, () => nanoId(length)));
  };

  const copyAll = () => navigator.clipboard.writeText(ids.join('\n'));

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50";
  void ic;

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-xs text-theme-text/60">Count <input type="number" min={1} max={100} value={count} onChange={e => setCount(Number(e.target.value))} className="w-16 bg-theme-surface border border-theme-border/20 rounded-lg px-2 py-1 text-xs text-theme-text" /></label>
        <label className="flex items-center gap-2 text-xs text-theme-text/60">Length <input type="number" min={4} max={64} value={length} onChange={e => setLength(Number(e.target.value))} className="w-16 bg-theme-surface border border-theme-border/20 rounded-lg px-2 py-1 text-xs text-theme-text" /></label>
        <button onClick={generate} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">Generate</button>
      </div>
      {ids.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-theme-text/30">{ids.length} IDs</span>
            <button onClick={copyAll} className="text-[10px] text-theme-icon hover:underline">Copy All</button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {ids.map((id, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-theme-background rounded-lg group">
                <code className="text-xs text-theme-text font-mono">{id}</code>
                <button onClick={() => navigator.clipboard.writeText(id)} className="text-[10px] text-theme-text/30 hover:text-theme-icon opacity-0 group-hover:opacity-100 transition-opacity">Copy</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
