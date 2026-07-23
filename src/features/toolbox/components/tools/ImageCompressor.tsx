import { useState, useCallback, useRef } from 'react';
import { FaUpload, FaDownload, FaCompress } from 'react-icons/fa';

export function ImageCompressor() {
  const [originalSrc, setOriginalSrc] = useState<string | null>(null);
  const [compressedSrc, setCompressedSrc] = useState<string | null>(null);
  const [quality, setQuality] = useState(0.7);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [fileName, setFileName] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setFileName(file.name);
    setOriginalSize(file.size);
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalSrc(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const compress = useCallback(() => {
    if (!originalSrc) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) return;
        setCompressedSize(blob.size);
        const url = URL.createObjectURL(blob);
        setCompressedSrc(url);
      }, 'image/jpeg', quality);
    };
    img.src = originalSrc;
  }, [originalSrc, quality]);

  const download = () => {
    if (!compressedSrc) return;
    const a = document.createElement('a');
    a.href = compressedSrc;
    const ext = fileName.includes('.') ? fileName.split('.').pop() : 'jpg';
    a.download = `compressed-${fileName || 'image'}.${ext}`;
    a.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />

      {!originalSrc ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-theme-border/30 rounded-2xl p-10 cursor-pointer hover:border-theme-icon/40 transition-colors">
          <FaUpload className="w-8 h-8 text-theme-text/30 mb-3" />
          <span className="text-sm text-theme-text/50">Click to upload an image</span>
          <span className="text-xs text-theme-text/30 mt-1">Supports JPG, PNG, WebP</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />
        </label>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-theme-text/50 mb-1 block">Original ({formatSize(originalSize)})</label>
              <img src={originalSrc} alt="Original" className="w-full rounded-xl border border-theme-border/20 max-h-64 object-contain bg-theme-background" />
            </div>
            <div>
              <label className="text-xs font-medium text-theme-text/50 mb-1 block">
                Compressed ({compressedSrc ? formatSize(compressedSize) : '-'})
                {compressedSrc && originalSize > 0 && (
                  <span className="text-green-400 ml-2">-{Math.round((1 - compressedSize / originalSize) * 100)}%</span>
                )}
              </label>
              {compressedSrc ? (
                <img src={compressedSrc} alt="Compressed" className="w-full rounded-xl border border-theme-border/20 max-h-64 object-contain bg-theme-background" />
              ) : (
                <div className="w-full rounded-xl border border-theme-border/20 max-h-64 flex items-center justify-center bg-theme-background" style={{ minHeight: '8rem' }}>
                  <span className="text-xs text-theme-text/30">Click compress to preview</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs text-theme-text/50 mb-1 block">Quality: {Math.round(quality * 100)}%</label>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full accent-theme-icon"
              />
            </div>
            <button onClick={compress} className="flex items-center gap-2 px-5 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors">
              <FaCompress className="w-3 h-3" /> Compress
            </button>
            {compressedSrc && (
              <button onClick={download} className="flex items-center gap-2 px-4 py-2 bg-theme-surface border border-theme-border/50 text-theme-text rounded-xl text-sm font-medium hover:bg-theme-surface/80 transition-colors">
                <FaDownload className="w-3 h-3" /> Download
              </button>
            )}
          </div>

          <button
            onClick={() => { setOriginalSrc(null); setCompressedSrc(null); setOriginalSize(0); setCompressedSize(0); }}
            className="text-xs text-theme-text/40 hover:text-theme-text/60 transition-colors"
          >
            Clear & upload another
          </button>
        </>
      )}
    </div>
  );
}
