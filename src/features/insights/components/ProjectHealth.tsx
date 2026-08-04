import { InsightWidget } from './InsightWidget';

interface ProjectHealthItem {
  name: string;
  status: 'healthy' | 'warning' | 'inactive';
  detail?: string;
  tasks?: number;
  bugs?: number;
}

interface Props {
  projects: ProjectHealthItem[];
}

const STATUS_COLORS = {
  healthy: { dot: 'bg-emerald-400', label: 'Healthy' },
  warning: { dot: 'bg-amber-400', label: 'Warning' },
  inactive: { dot: 'bg-red-400', label: 'Inactive' },
};

export function ProjectHealth({ projects }: Props) {
  return (
    <InsightWidget title="Project Health" subtitle="From last activity">
      <div className="space-y-3">
        {projects.map((p) => {
          const sc = STATUS_COLORS[p.status];
          return (
            <div key={p.name} className="border border-theme-border/10 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-theme-text">{p.name}</span>
                <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider">
                  <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                  {sc.label}
                </span>
              </div>
              {p.detail && <p className="text-[10px] text-theme-text/40">{p.detail}</p>}
              {(p.tasks !== undefined || p.bugs !== undefined) && (
                <div className="flex gap-4 mt-2 text-[10px] text-theme-text/50">
                  {p.tasks !== undefined && <span>{p.tasks} tasks</span>}
                  {p.bugs !== undefined && <span>{p.bugs} bugs</span>}
                </div>
              )}
            </div>
          );
        })}
        {projects.length === 0 && (
          <p className="text-xs text-theme-text/40 text-center py-4">No projects tracked yet</p>
        )}
      </div>
    </InsightWidget>
  );
}
