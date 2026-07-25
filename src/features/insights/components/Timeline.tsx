import { useState } from 'react';
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
  const [showAll, setShowAll] = useState(false);
  const display = showAll ? events : events.slice(0, 10);

  return (
    <InsightWidget
      title="Activity Timeline"
      subtitle={`${events.length} events`}
      action={
        events.length > 10 ? (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[11px] text-theme-icon/60 hover:text-theme-icon transition-colors"
          >
            {showAll ? 'Show Less' : 'View All'}
          </button>
        ) : undefined
      }
    >
      <div className="space-y-0">
        {display.map((e, i) => (
          <div key={i} className="flex gap-3 py-2.5 border-b border-theme-border/5 last:border-0">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-theme-text/30 w-12 text-right shrink-0 mt-0.5">{e.time}</span>
              {i < display.length - 1 && <div className="w-px flex-1 bg-theme-border/10 mt-1" />}
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs shrink-0">{TYPE_ICONS[e.type] || '•'}</span>
              <span className="text-xs text-theme-text/70 truncate">{e.description}</span>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <p className="text-xs text-theme-text/40 text-center py-4">No activity in this period</p>
        )}
      </div>
    </InsightWidget>
  );
}
