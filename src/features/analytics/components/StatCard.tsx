import { type ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  sub?: string;
}

export function StatCard({ label, value, icon, sub }: StatCardProps) {
  return (
    <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-theme-text/50 font-medium">{label}</p>
          <p className="text-2xl font-bold text-theme-text mt-1">{value}</p>
          {sub && <p className="text-[10px] text-theme-text/30 mt-0.5">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-theme-icon/10 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}
