import { useState } from 'react';
import { FaUniversalAccess, FaFont, FaTextHeight, FaMousePointer } from 'react-icons/fa';

function lsGet(key: string, def: string): string {
  try { return localStorage.getItem(key) || def; } catch { return def; }
}
function lsSet(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

export function AccessibilitySettings() {
  const [fontSize, setFontSize] = useState(() => {
    return parseInt(lsGet('devos_font_size', '100'));
  });

  const [highContrast, setHighContrast] = useState(
    () => lsGet('devos_high_contrast', 'false') === 'true'
  );

  const handleFontSize = (delta: number) => {
    const next = Math.min(Math.max(fontSize + delta, 80), 150);
    setFontSize(next);
    lsSet('devos_font_size', String(next));
    document.documentElement.style.fontSize = `${next}%`;
  };

  const toggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    lsSet('devos_high_contrast', String(next));
    document.documentElement.classList.toggle('high-contrast', next);
  };

  return (
    <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5 space-y-5">
      <h3 className="text-sm font-semibold text-theme-text flex items-center gap-2">
        <FaUniversalAccess className="w-4 h-4 text-theme-icon" />
        Accessibility
      </h3>

      <div>
        <label className="flex items-center gap-2 text-xs text-theme-text/60 mb-2">
          <FaTextHeight className="w-3 h-3" /> Font Size
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleFontSize(-10)}
            disabled={fontSize <= 80}
            className="px-3 py-1.5 bg-theme-background border border-theme-border/30 rounded-lg text-xs text-theme-text/60 hover:text-theme-icon disabled:opacity-30 transition-colors"
          >
            A-
          </button>
          <div className="flex-1 bg-theme-background border border-theme-border/30 rounded-xl h-2 relative">
            <div
              className="absolute left-0 top-0 h-full bg-theme-icon rounded-xl transition-all"
              style={{ width: `${((fontSize - 80) / 70) * 100}%` }}
            />
          </div>
          <button
            onClick={() => handleFontSize(10)}
            disabled={fontSize >= 150}
            className="px-3 py-1.5 bg-theme-background border border-theme-border/30 rounded-lg text-xs text-theme-text/60 hover:text-theme-icon disabled:opacity-30 transition-colors"
          >
            A+
          </button>
          <span className="text-xs text-theme-text/40 w-8 text-right">{fontSize}%</span>
        </div>
      </div>

      <label className="flex items-center justify-between cursor-pointer">
        <div>
          <span className="text-sm text-theme-text">High Contrast Mode</span>
          <p className="text-[10px] text-theme-text/40">Enhance color contrast for better readability</p>
        </div>
        <input
          type="checkbox"
          checked={highContrast}
          onChange={toggleHighContrast}
          className="rounded border-theme-border/30 text-theme-icon focus:ring-theme-icon/30"
        />
      </label>

      <div className="bg-theme-background rounded-xl p-3 text-xs text-theme-text/40 space-y-1.5">
        <p className="flex items-center gap-1.5"><FaUniversalAccess className="w-3 h-3" /> Press <kbd className="px-1 py-0.5 bg-theme-border/20 rounded text-[10px]">Ctrl+K</kbd> for command palette</p>
        <p className="flex items-center gap-1.5"><FaMousePointer className="w-3 h-3" /> All interactive elements are keyboard accessible</p>
        <p className="flex items-center gap-1.5"><FaFont className="w-3 h-3" /> ARIA labels provided on all controls</p>
      </div>
    </div>
  );
}
