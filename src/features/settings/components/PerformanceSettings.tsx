import { useState } from 'react';
import { FaTachometerAlt, FaImage, FaCog } from 'react-icons/fa';

export function PerformanceSettings() {
  const [reducedMotion, setReducedMotion] = useState(
    () => localStorage.getItem('devos_reduced_motion') === 'true'
  );
  const [reducedTransparency, setReducedTransparency] = useState(
    () => localStorage.getItem('devos_reduced_transparency') === 'true'
  );

  const toggle = (key: string, setter: (v: boolean) => void, current: boolean) => {
    const next = !current;
    localStorage.setItem(key, String(next));
    if (key === 'devos_reduced_motion') {
      document.documentElement.classList.toggle('reduce-motion', next);
    }
    if (key === 'devos_reduced_transparency') {
      document.documentElement.classList.toggle('reduce-transparency', next);
    }
    setter(next);
  };

  return (
    <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-theme-text flex items-center gap-2">
        <FaTachometerAlt className="w-4 h-4 text-theme-icon" />
        Performance Options
      </h3>

      <label className="flex items-center justify-between cursor-pointer">
        <div>
          <span className="text-sm text-theme-text">Reduced Motion</span>
          <p className="text-[10px] text-theme-text/40">Disable animations and transitions</p>
        </div>
        <input
          type="checkbox"
          checked={reducedMotion}
          onChange={() => toggle('devos_reduced_motion', setReducedMotion, reducedMotion)}
          className="rounded border-theme-border/30 text-theme-icon focus:ring-theme-icon/30"
        />
      </label>

      <label className="flex items-center justify-between cursor-pointer">
        <div>
          <span className="text-sm text-theme-text">Reduced Transparency</span>
          <p className="text-[10px] text-theme-text/40">Disable backdrop blur effects</p>
        </div>
        <input
          type="checkbox"
          checked={reducedTransparency}
          onChange={() => toggle('devos_reduced_transparency', setReducedTransparency, reducedTransparency)}
          className="rounded border-theme-border/30 text-theme-icon focus:ring-theme-icon/30"
        />
      </label>

      <details className="text-xs text-theme-text/40">
        <summary className="cursor-pointer hover:text-theme-text/60 flex items-center gap-1">
          <FaCog className="w-3 h-3" /> Bundle info
        </summary>
        <div className="mt-2 space-y-1">
          <p>All pages are lazy-loaded for code splitting.</p>
          <p>Charts and widgets in the Insights page.</p>
          <p>SQL.js WASM loaded on first database fallback.</p>
        </div>
      </details>
    </div>
  );
}
