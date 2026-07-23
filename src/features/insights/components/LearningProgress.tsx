import { InsightWidget, BarRow } from './InsightWidget';

interface Props {
  topics: { name: string; progress: number }[];
}

export function LearningProgress({ topics }: Props) {
  const max = 100;

  return (
    <InsightWidget title="Learning Progress" subtitle="Based on notes, projects, and time">
      <div className="space-y-2">
        {topics.map((t) => (
          <BarRow key={t.name} label={t.name} value={t.progress} max={max} suffix="%" />
        ))}
        {topics.length === 0 && (
          <p className="text-xs text-theme-text/40 text-center py-4">Start learning to track progress</p>
        )}
      </div>
    </InsightWidget>
  );
}
