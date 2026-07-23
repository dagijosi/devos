import { useState, useRef } from 'react';

export function Base64ImageTool() {
  const [dataUrl, setDataUrl] = useState('');
  const [base64String, setBase64String] = useState('');
  const [mode, setMode] = useState<'encode' | 'preview'>('encode');
  const inputRef = useRef<HTMLInputElement>(null);

  const encode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setDataUrl(result);
      setBase64String(result.split(',')[1]);
    };
    reader.readAsDataURL(f);
  };

  const copy = () => navigator.clipboard.writeText(base64String);

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50 font-mono";

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setMode('encode')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mode === 'encode' ? 'bg-theme-icon/10 text-theme-icon border border-theme-icon/20' : 'bg-theme-surface border border-theme-border/20 text-theme-text/60'}`}>Encode Image</button>
        <button onClick={() => setMode('preview')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mode === 'preview' ? 'bg-theme-icon/10 text-theme-icon border border-theme-icon/20' : 'bg-theme-surface border border-theme-border/20 text-theme-text/60'}`}>Preview Data URL</button>
      </div>
      {mode === 'encode' ? (
        <>
          <input ref={inputRef} type="file" accept="image/*" onChange={encode} className="hidden" />
          {!dataUrl && <button onClick={() => inputRef.current?.click()} className="w-full py-8 border-2 border-dashed border-theme-border/20 rounded-xl text-xs text-theme-text/30 hover:border-theme-icon/30 hover:text-theme-icon/50 transition-colors">Select an image to encode</button>}
          {dataUrl && (
            <div className="space-y-3">
              <img src={dataUrl} className="max-w-48 max-h-32 rounded-lg border border-theme-border/10" />
              <textarea readOnly value={base64String} rows={6} className={ic} />
              <button onClick={copy} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">Copy Base64</button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <textarea value={dataUrl} onChange={e => { setDataUrl(e.target.value); setBase64String(e.target.value.split(',')[1] || ''); }} rows={4} placeholder="Paste data:image/... URL" className={ic} />
          {dataUrl && dataUrl.startsWith('data:') && <img src={dataUrl} className="max-w-48 max-h-32 rounded-lg border border-theme-border/10" />}
        </div>
      )}
    </div>
  );
}
