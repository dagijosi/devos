import { InsightWidget, ProgressBar } from './InsightWidget';

interface Props {
  weekData: { day: string; hours: number }[];
  maxHours: number;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CodingActivity({ weekData, maxHours }: Props) {
  const bars = DAY_LABELS.map((day) => {
    const found = weekData.find((d) => d.day.toLowerCase().startsWith(day.toLowerCase()));
    return { day, hours: found?.hours ?? 0 };
  });

  return (
    <InsightWidget title="Coding Activity" subtitle="This week">
      <div className="flex items-end gap-1.5 h-24 pt-2">
        {bars.map((b) => {
          const pct = maxHours > 0 ? (b.hours / maxHours) * 100 : 0;
          return (
            <div key={b.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-[9px] text-theme-text/40">{b.hours > 0 ? `${b.hours}h` : ''}</span>
              <div
                className="w-full rounded-md bg-theme-icon/60 transition-all duration-300"
                style={{ height: `${Math.max(pct, b.hours > 0 ? 4 : 0)}%`, minHeight: b.hours > 0 ? '4px' : '0px' }}
              />
              <span className="text-[9px] text-theme-text/40">{b.day.slice(0, 2)}</span>
            </div>
          );
        })}
      </div>
      {bars.every((b) => b.hours === 0) && (
        <p className="text-xs text-theme-text/40 text-center py-4">No activity this week</p>
      )}
    </InsightWidget>
  );
}
