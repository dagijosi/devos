import { useState, useCallback } from 'react';
import { FaDownload } from 'react-icons/fa';
import QRCode from 'qrcode';

export function QrGenerator() {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  const generate = useCallback(async () => {
    if (!text.trim()) { setError('Please enter text or URL'); return; }
    setError('');
    try {
      const url = await QRCode.toDataURL(text, {
        width: 400,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setQrDataUrl(url);
    } catch {
      setError('Failed to generate QR code');
    }
  }, [text]);

  const download = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'qrcode.png';
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && generate()}
          placeholder="Enter text or URL to encode..."
          className="flex-1 bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50"
        />
        <button onClick={generate} className="px-5 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors">
          Generate
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">{error}</div>
      )}

      {qrDataUrl && (
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white rounded-xl p-4 inline-block">
            <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
          </div>
          <button onClick={download} className="flex items-center gap-2 px-4 py-2 bg-theme-surface border border-theme-border/50 text-theme-text rounded-xl text-sm font-medium hover:bg-theme-surface/80 transition-colors">
            <FaDownload className="w-3 h-3" /> Download PNG
          </button>
        </div>
      )}

      {!qrDataUrl && !error && (
        <div className="flex flex-col items-center justify-center bg-theme-background border border-dashed border-theme-border/20 rounded-2xl p-10">
          <div className="w-24 h-24 border-2 border-dashed border-theme-border/20 rounded-xl flex items-center justify-center">
            <span className="text-4xl text-theme-text/20 font-mono">&#x25A6;</span>
          </div>
          <p className="text-xs text-theme-text/30 mt-3">Enter text and click Generate</p>
        </div>
      )}
    </div>
  );
}
