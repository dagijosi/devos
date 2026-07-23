import { useState } from 'react';

export function Minifier() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'json' | 'js' | 'css'>('json');

  const minify = () => {
    try {
      if (mode === 'json') {
        setOutput(JSON.stringify(JSON.parse(input)));
      } else if (mode === 'js') {
        setOutput(input.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}();,:])\s*/g, '$1').trim());
      } else {
        setOutput(input.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{};,:])\s*/g, '$1').replace(/;}/g, '}').trim());
      }
    } catch (e: any) { setOutput('Error: ' + e.message); }
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50 font-mono";
  const ob = "px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors";
  const tb = (m: string) => `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mode === m ? 'bg-theme-icon/10 text-theme-icon border border-theme-icon/20' : 'bg-theme-surface border border-theme-border/20 text-theme-text/60 hover:text-theme-text'}`;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['json', 'js', 'css'] as const).map(m => <button key={m} onClick={() => setMode(m)} className={tb(m)}>{m.toUpperCase()}</button>)}
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={6} placeholder={`Enter ${mode.toUpperCase()} to minify...`} className={ic} />
      <button onClick={minify} className={ob}>Minify</button>
      {output && <textarea readOnly value={output} rows={6} className={ic} />}
    </div>
  );
}
