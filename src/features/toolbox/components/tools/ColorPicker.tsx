import { useState, useCallback, useEffect } from 'react';
import { FaCopy, FaCheck } from 'react-icons/fa';

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function ColorPicker() {
  const [color, setColor] = useState('#6366f1');
  const [copied, setCopied] = useState('');

  const rgb = hexToRgb(color);
  const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;

  const copyValue = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const formatRgb = rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '';
  const formatHsl = hsl ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : '';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-16 h-16 rounded-xl border border-theme-border/30 cursor-pointer bg-transparent p-0.5"
          />
        </div>
        <div className="flex-1 space-y-2">
          {[
            { label: 'HEX', value: color },
            { label: 'RGB', value: formatRgb },
            { label: 'HSL', value: formatHsl },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-xs text-theme-text/50 w-8 font-mono">{label}</span>
              <span className="flex-1 text-sm text-theme-text/80 font-mono">{value || '-'}</span>
              {value && (
                <button onClick={() => copyValue(label, value)} className="p-1 text-theme-text/30 hover:text-theme-text/60">
                  {copied === label ? <FaCheck className="w-3 h-3 text-green-400" /> : <FaCopy className="w-3 h-3" />}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-theme-text/70 mb-1.5 block">Custom HEX</label>
        <input
          type="text"
          value={color}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-f]{0,6}$/i.test(v)) setColor(v);
          }}
          placeholder="#6366f1"
          className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 font-mono"
        />
      </div>
    </div>
  );
}
