import { InsightWidget, ProgressBar } from './InsightWidget';

interface FocusEntry {
  label: string;
  minutes: number;
}

interface Props {
  entries: FocusEntry[];
  totalMinutes: number;
}

export function FocusTime({ entries, totalMinutes }: Props) {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return (
    <InsightWidget title="Focus Time" subtitle={`${hours}h ${mins}m total`}>
      <div className="space-y-3">
        {entries.map((e) => (
          <div key={e.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-theme-text/70">{e.label}</span>
              <span className="text-theme-text font-medium">{Math.floor(e.minutes / 60)}h {e.minutes % 60}m</span>
            </div>
            <ProgressBar value={e.minutes} max={totalMinutes} color="bg-violet-400" size="sm" />
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-xs text-theme-text/40 text-center py-4">No focus time tracked yet</p>
        )}
      </div>
    </InsightWidget>
  );
}
