import { useState } from 'react';

export function UnicodeEncoder() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'escape' | 'unescape'>('escape');

  const convert = () => {
    try {
      if (mode === 'escape') {
        setOutput(Array.from(input).map(c => {
          const code = c.charCodeAt(0);
          return code > 127 ? `\\u${code.toString(16).padStart(4, '0')}` : c;
        }).join(''));
      } else {
        setOutput(input.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))));
      }
    } catch (e: any) { setOutput('Error: ' + e.message); }
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50 font-mono";
  const tb = (m: string) => `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mode === m ? 'bg-theme-icon/10 text-theme-icon border border-theme-icon/20' : 'bg-theme-surface border border-theme-border/20 text-theme-text/60 hover:text-theme-text'}`;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setMode('escape')} className={tb('escape')}>Escape</button>
        <button onClick={() => setMode('unescape')} className={tb('unescape')}>Unescape</button>
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={4} placeholder={mode === 'escape' ? 'Enter text with Unicode...' : 'Enter \\uXXXX sequences...'} className={ic} />
      <button onClick={convert} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">Convert</button>
      {output && <textarea readOnly value={output} rows={4} className={ic} />}
    </div>
  );
}
