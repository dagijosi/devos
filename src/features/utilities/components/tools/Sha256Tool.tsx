import { useState } from 'react';

export function Sha256Tool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const hash = async () => {
    const enc = new TextEncoder().encode(input);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    setOutput(Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50 font-mono";

  return (
    <div className="space-y-4">
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={4} placeholder="Enter text to hash..." className={ic} />
      <button onClick={hash} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">Generate SHA-256</button>
      {output && (
        <div className="flex items-center gap-3 p-3 bg-theme-background rounded-lg">
          <code className="text-xs text-theme-text font-mono break-all flex-1">{output}</code>
          <button onClick={() => navigator.clipboard.writeText(output)} className="text-[10px] px-2 py-1 rounded bg-theme-surface border border-theme-border/20 text-theme-text/60 hover:text-theme-icon shrink-0">Copy</button>
        </div>
      )}
    </div>
  );
}
