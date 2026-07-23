import { useState, useCallback } from 'react';
import { FaCopy, FaCheck, FaSync } from 'react-icons/fa';

function generateUUID(): string {
  return crypto.randomUUID();
}

export function UuidGenerator() {
  const [count, setCount] = useState(1);
  const [uuids, setUuids] = useState<string[]>(() => [generateUUID()]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const generate = useCallback(() => {
    const n = Math.min(Math.max(count, 1), 100);
    setUuids(Array.from({ length: n }, () => generateUUID()));
  }, [count]);

  const copyUUID = async (uuid: string, idx: number) => {
    await navigator.clipboard.writeText(uuid);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(uuids.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-theme-text/70">Count:</label>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.min(Math.max(parseInt(e.target.value) || 1, 1), 100))}
            className="w-20 bg-theme-background border border-theme-border/30 rounded-xl px-3 py-2 text-sm text-theme-text text-center outline-none focus:border-theme-icon/50"
          />
        </div>
        <button onClick={generate} className="flex items-center gap-2 px-5 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors">
          <FaSync className="w-3 h-3" /> Generate
        </button>
        {uuids.length > 0 && (
          <button onClick={copyAll} className="flex items-center gap-1 px-3 py-2 text-xs text-theme-text/40 hover:text-theme-text/70 border border-theme-border/30 rounded-xl transition-colors">
            {copiedAll ? <FaCheck className="w-3 h-3 text-green-400" /> : <FaCopy className="w-3 h-3" />}
            {copiedAll ? 'Copied All' : 'Copy All'}
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        {uuids.map((uuid, i) => (
          <div key={i} className="flex items-center gap-2 bg-theme-background border border-theme-border/20 rounded-xl px-4 py-2.5 group hover:border-theme-border/40 transition-colors">
            <span className="flex-1 text-sm text-theme-text/80 font-mono truncate">{uuid}</span>
            <button
              onClick={() => copyUUID(uuid, i)}
              className="p-1.5 text-theme-text/30 hover:text-theme-text/60 opacity-0 group-hover:opacity-100 transition-all"
              title="Copy"
            >
              {copiedIndex === i ? <FaCheck className="w-3 h-3 text-green-400" /> : <FaCopy className="w-3 h-3" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
