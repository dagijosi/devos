import { useState } from 'react';

export function ChecksumTool() {
  const [input, setInput] = useState('');
  const [algo, setAlgo] = useState<'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'>('SHA-256');
  const [output, setOutput] = useState('');

  const compute = async () => {
    const enc = new TextEncoder().encode(input);
    const buf = await crypto.subtle.digest(algo, enc);
    setOutput(Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50 font-mono";
  const tb = (a: string) => `px-2 py-1 rounded text-[10px] font-medium transition-colors ${algo === a ? 'bg-theme-icon/10 text-theme-icon border border-theme-icon/20' : 'bg-theme-surface border border-theme-border/20 text-theme-text/60 hover:text-theme-text'}`;

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5">
        {['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'].map(a => <button key={a} onClick={() => setAlgo(a as any)} className={tb(a)}>{a}</button>)}
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={4} placeholder="Enter text or paste file content..." className={ic} />
      <button onClick={compute} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">Compute Checksum</button>
      {output && (
        <div className="flex items-center gap-3 p-3 bg-theme-background rounded-lg">
          <code className="text-xs text-theme-text font-mono break-all flex-1">{output}</code>
          <button onClick={() => navigator.clipboard.writeText(output)} className="text-[10px] px-2 py-1 rounded bg-theme-surface border border-theme-border/20 text-theme-text/60 hover:text-theme-icon shrink-0">Copy</button>
        </div>
      )}
    </div>
  );
}
