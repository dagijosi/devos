import { useState, useRef } from 'react';

export function ResizeImage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [width, setWidth] = useState(200);
  const [height, setHeight] = useState(200);
  const [resized, setResized] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      const img = new Image();
      img.onload = () => { setWidth(img.naturalWidth); setHeight(img.naturalHeight); };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(f);
  };

  const resize = () => {
    if (!preview) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      setResized(canvas.toDataURL(file?.type || 'image/png'));
    };
    img.src = preview;
  };

  const ic = "bg-theme-surface border border-theme-border/20 rounded-lg px-2 py-1 text-xs text-theme-text outline-none focus:border-theme-icon/50";

  return (
    <div className="space-y-4">
      <input ref={inputRef} type="file" accept="image/*" onChange={loadFile} className="hidden" />
      {!file && <button onClick={() => inputRef.current?.click()} className="w-full py-8 border-2 border-dashed border-theme-border/20 rounded-xl text-xs text-theme-text/30 hover:border-theme-icon/30 hover:text-theme-icon/50 transition-colors">Click to select an image</button>}
      {preview && (
        <>
          <div className="flex gap-4 items-center">
            <label className="text-xs text-theme-text/60">W: <input type="number" min={1} value={width} onChange={e => setWidth(Number(e.target.value))} className={`${ic} w-20`} /></label>
            <label className="text-xs text-theme-text/60">H: <input type="number" min={1} value={height} onChange={e => setHeight(Number(e.target.value))} className={`${ic} w-20`} /></label>
            <button onClick={resize} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">Resize</button>
            <button onClick={() => { setFile(null); setPreview(''); setResized(''); }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-surface border border-theme-border/20 text-theme-text hover:bg-theme-border/10 transition-colors">Clear</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {preview && <div><p className="text-[10px] text-theme-text/30 mb-1">Original</p><img src={preview} className="max-w-full max-h-48 rounded-lg border border-theme-border/10" /></div>}
            {resized && <div><p className="text-[10px] text-theme-text/30 mb-1">{width}×{height}</p><img src={resized} className="max-w-full max-h-48 rounded-lg border border-theme-border/10" /></div>}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </>
      )}
    </div>
  );
}
