interface Props {
  value: number;
  max: number;
  label?: string;
  size?: 'sm' | 'md';
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

const COLORS = {
  blue: 'bg-blue-500', green: 'bg-green-500', yellow: 'bg-yellow-500', red: 'bg-red-500',
};

export function ProgressBar({ value, max, label, size = 'sm', color = 'blue' }: Props) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-theme-text/50">{label}</span>
          <span className="text-[10px] font-mono text-theme-text/40">{pct}%</span>
        </div>
      )}
      <div className={`w-full bg-theme-background/50 rounded-full overflow-hidden ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`}>
        <div
          className={`${COLORS[color]} h-full rounded-full transition-all duration-500 ease-out ${pct > 0 && pct < 100 ? 'animate-pulse' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
