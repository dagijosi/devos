import { InsightWidget } from './InsightWidget';

interface TimelineEvent {
  time: string;
  description: string;
  type: string;
}

interface Props {
  events: TimelineEvent[];
}

const TYPE_ICONS: Record<string, string> = {
  project: '📁',
  note: '📝',
  bug: '🐛',
  commit: '🔨',
  backup: '💾',
  goal: '🎯',
  task: '✅',
};

export function Timeline({ events }: Props) {
  return (
    <InsightWidget title="Timeline" subtitle="Your activity today" action={
      <button className="text-[11px] text-theme-icon/60 hover:text-theme-icon transition-colors">View All</button>
    }>
      <div className="space-y-0">
        {events.slice(0, 10).map((e, i) => (
          <div key={i} className="flex gap-3 py-2.5 border-b border-theme-border/5 last:border-0">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-theme-text/30 w-12 text-right shrink-0 mt-0.5">{e.time}</span>
              {i < events.length - 1 && <div className="w-px flex-1 bg-theme-border/10 mt-1" />}
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs shrink-0">{TYPE_ICONS[e.type] || '•'}</span>
              <span className="text-xs text-theme-text/70 truncate">{e.description}</span>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <p className="text-xs text-theme-text/40 text-center py-4">No activity yet today</p>
        )}
      </div>
    </InsightWidget>
  );
}
