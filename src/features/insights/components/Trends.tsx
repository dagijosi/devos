import { InsightWidget } from './InsightWidget';

interface TrendItem {
  label: string;
  change: number;
}

interface Props {
  trends: TrendItem[];
}

export function Trends({ trends }: Props) {
  return (
    <InsightWidget title="Trends" subtitle="Compared to last week">
      <div className="space-y-2">
        {trends.map((t) => (
          <div key={t.label} className="flex items-center justify-between py-1.5 border-b border-theme-border/5 last:border-0">
            <span className="text-xs text-theme-text/60">{t.label}</span>
            <span className={`text-xs font-semibold ${t.change > 0 ? 'text-emerald-400' : t.change < 0 ? 'text-red-400' : 'text-theme-text/40'}`}>
              {t.change > 0 ? '+' : ''}{t.change}%
            </span>
          </div>
        ))}
        {trends.length === 0 && (
          <p className="text-xs text-theme-text/40 text-center py-4">Not enough data for trends</p>
        )}
      </div>
    </InsightWidget>
  );
}
