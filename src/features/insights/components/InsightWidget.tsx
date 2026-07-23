import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function InsightWidget({ title, subtitle, children, className = '', action }: Props) {
  return (
    <div className={`bg-theme-surface border border-theme-border/20 rounded-2xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-theme-text">{title}</h3>
          {subtitle && <p className="text-[11px] text-theme-text/40 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}

export function StatRow({ label, value, suffix, color }: { label: string; value: string | number; suffix?: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-theme-text/60">{label}</span>
      <span className="text-sm font-semibold text-theme-text" style={color ? { color } : undefined}>
        {value}{suffix && <span className="text-xs text-theme-text/40 ml-0.5">{suffix}</span>}
      </span>
    </div>
  );
}

export function ProgressBar({ value, max = 100, color = 'bg-theme-icon', size = 'md' }: { value: number; max?: number; color?: string; size?: 'sm' | 'md' }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={`w-full bg-theme-background/50 rounded-full ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`}>
      <div className={`${color} rounded-full ${size === 'sm' ? 'h-1.5' : 'h-2.5'} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function BarRow({ label, value, max, suffix }: { label: string; value: number; max: number; suffix?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-theme-text/70 truncate">{label}</span>
        <span className="text-theme-text font-medium shrink-0 ml-2">{suffix ? `${value}${suffix}` : value}</span>
      </div>
      <ProgressBar value={pct} max={100} />
    </div>
  );
}
