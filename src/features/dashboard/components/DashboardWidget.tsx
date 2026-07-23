import type { ReactNode } from 'react';

interface DashboardWidgetProps {
  title: string;
  icon?: ReactNode;
  action?: { label: string; onClick: () => void };
  children: ReactNode;
  className?: string;
  loading?: boolean;
}

export function DashboardWidget({ title, icon, action, children, className = '', loading }: DashboardWidgetProps) {
  return (
    <div className={`bg-theme-surface border border-theme-border/30 rounded-2xl overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-theme-border/10">
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="text-theme-icon shrink-0">{icon}</span>}
          <h3 className="text-sm font-semibold text-theme-text truncate">{title}</h3>
        </div>
        {action && (
          <button onClick={action.onClick} className="text-xs text-theme-icon/60 hover:text-theme-icon transition-colors shrink-0">
            {action.label}
          </button>
        )}
      </div>
      <div className="p-5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-theme-border/10 rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} />
            ))}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
