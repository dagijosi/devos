import { InsightWidget, ProgressBar } from './InsightWidget';
import type { Goal } from '../types';

interface Props {
  goals: Goal[];
}

export function GoalsWidget({ goals }: Props) {
  const active = goals.filter((g) => g.status === 'active');

  return (
    <InsightWidget title="Goals" subtitle="Weekly objectives">
      <div className="space-y-3">
        {active.map((g) => (
          <div key={g.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-theme-text/70 truncate">{g.title}</span>
              <span className="text-theme-text font-medium shrink-0 ml-2">{Math.round((g.progress / g.target) * 100)}%</span>
            </div>
            <ProgressBar value={g.progress} max={g.target} color={g.progress >= g.target ? 'bg-emerald-400' : 'bg-theme-icon'} />
          </div>
        ))}
        {active.length === 0 && (
          <p className="text-xs text-theme-text/40 text-center py-4">No active goals</p>
        )}
      </div>
    </InsightWidget>
  );
}
