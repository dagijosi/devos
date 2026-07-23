import { InsightWidget, BarRow } from './InsightWidget';

interface Props {
  projects: { name: string; percentage: number }[];
}

export function ProjectActivity({ projects }: Props) {
  const max = projects.reduce((m, p) => Math.max(m, p.percentage), 0) || 1;

  return (
    <InsightWidget title="Project Distribution" subtitle="Where your time goes">
      <div className="space-y-3">
        {projects.map((p) => (
          <BarRow key={p.name} label={p.name} value={p.percentage} max={max} suffix="%" />
        ))}
        {projects.length === 0 && (
          <p className="text-xs text-theme-text/40 text-center py-4">No project activity yet</p>
        )}
      </div>
    </InsightWidget>
  );
}
