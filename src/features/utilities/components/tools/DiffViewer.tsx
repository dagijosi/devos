import { useState, useMemo } from 'react';

function computeDiff(oldText: string, newText: string): { type: 'same' | 'added' | 'removed'; text: string }[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result: { type: 'same' | 'added' | 'removed'; text: string }[] = [];
  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    if (i >= oldLines.length) result.push({ type: 'added', text: newLines[i] });
    else if (i >= newLines.length) result.push({ type: 'removed', text: oldLines[i] });
    else if (oldLines[i] === newLines[i]) result.push({ type: 'same', text: oldLines[i] });
    else {
      result.push({ type: 'removed', text: oldLines[i] });
      result.push({ type: 'added', text: newLines[i] });
    }
  }
  return result;
}

export function DiffViewer() {
  const [oldText, setOldText] = useState('');
  const [newText, setNewText] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const diff = useMemo(() => computeDiff(oldText, newText), [oldText, newText, showDiff]);

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50 font-mono";

  return (
    <div className="space-y-4">
      {!showDiff ? (
        <div className="grid grid-cols-2 gap-4 h-[300px]">
          <textarea value={oldText} onChange={e => setOldText(e.target.value)} rows={12} placeholder="Original text..." className={ic} />
          <textarea value={newText} onChange={e => setNewText(e.target.value)} rows={12} placeholder="Modified text..." className={ic} />
        </div>
      ) : (
        <div className="bg-theme-background border border-theme-border/20 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto font-mono text-xs">
          {diff.map((d, i) => (
            <div key={i} className={`px-4 py-1 ${d.type === 'added' ? 'bg-green-500/10 text-green-300' : d.type === 'removed' ? 'bg-red-500/10 text-red-300' : 'text-theme-text/70'}`}>
              <span className="mr-2">{d.type === 'added' ? '+' : d.type === 'removed' ? '-' : ' '}</span>
              <span>{d.text || ' '}</span>
            </div>
          ))}
        </div>
      )}
      <button onClick={() => setShowDiff(!showDiff)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">
        {showDiff ? 'Edit Texts' : 'Compare'}
      </button>
    </div>
  );
}
