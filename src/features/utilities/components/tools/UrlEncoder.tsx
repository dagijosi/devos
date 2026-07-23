import { useState } from 'react';

export function UrlEncoder() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  const convert = () => {
    try {
      setOutput(mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input));
    } catch (e: any) { setOutput('Error: ' + e.message); }
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50 font-mono";
  const tb = (m: string) => `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mode === m ? 'bg-theme-icon/10 text-theme-icon border border-theme-icon/20' : 'bg-theme-surface border border-theme-border/20 text-theme-text/60 hover:text-theme-text'}`;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setMode('encode')} className={tb('encode')}>Encode</button>
        <button onClick={() => setMode('decode')} className={tb('decode')}>Decode</button>
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={4} placeholder={mode === 'encode' ? 'Enter text to URL-encode...' : 'Enter URL-encoded text...'} className={ic} />
      <button onClick={convert} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">{mode === 'encode' ? 'Encode' : 'Decode'}</button>
      {output && <textarea readOnly value={output} rows={4} className={ic} />}
    </div>
  );
}
