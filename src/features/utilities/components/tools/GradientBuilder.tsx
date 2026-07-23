import { useState, useMemo } from 'react';

export function GradientBuilder() {
  const [color1, setColor1] = useState('#4F8EF7');
  const [color2, setColor2] = useState('#C99014');
  const [angle, setAngle] = useState(135);
  const [type, setType] = useState<'linear' | 'radial'>('linear');
  const css = useMemo(() => {
    return type === 'linear'
      ? `background: linear-gradient(${angle}deg, ${color1}, ${color2});`
      : `background: radial-gradient(circle, ${color1}, ${color2});`;
  }, [color1, color2, angle, type]);

  return (
    <div className="space-y-6">
      <div className="h-32 rounded-xl border border-theme-border/20" style={{ background: type === 'linear' ? `linear-gradient(${angle}deg, ${color1}, ${color2})` : `radial-gradient(circle, ${color1}, ${color2})` }} />
      <div className="grid grid-cols-2 gap-4">
        <label className="text-xs text-theme-text/60">Color 1 <input type="color" value={color1} onChange={e => setColor1(e.target.value)} className="block mt-1 w-full h-8 rounded cursor-pointer" /></label>
        <label className="text-xs text-theme-text/60">Color 2 <input type="color" value={color2} onChange={e => setColor2(e.target.value)} className="block mt-1 w-full h-8 rounded cursor-pointer" /></label>
      </div>
      <div className="flex gap-4 items-center">
        <div className="flex gap-1.5">
          <button onClick={() => setType('linear')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${type === 'linear' ? 'bg-theme-icon/10 text-theme-icon border border-theme-icon/20' : 'bg-theme-surface border border-theme-border/20 text-theme-text/60'}`}>Linear</button>
          <button onClick={() => setType('radial')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${type === 'radial' ? 'bg-theme-icon/10 text-theme-icon border border-theme-icon/20' : 'bg-theme-surface border border-theme-border/20 text-theme-text/60'}`}>Radial</button>
        </div>
        {type === 'linear' && <label className="text-xs text-theme-text/60">Angle: <input type="range" min={0} max={360} value={angle} onChange={e => setAngle(Number(e.target.value))} className="w-24 align-middle ml-1 accent-theme-icon" /> {angle}°</label>}
      </div>
      <div className="bg-theme-background border border-theme-border/20 rounded-xl p-4">
        <pre className="text-xs text-theme-text font-mono">{css}</pre>
        <button onClick={() => navigator.clipboard.writeText(css)} className="mt-2 text-[10px] text-theme-icon hover:underline">Copy CSS</button>
      </div>
    </div>
  );
}
