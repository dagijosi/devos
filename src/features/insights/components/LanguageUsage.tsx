import { InsightWidget, BarRow } from './InsightWidget';

interface Props {
  languages: { name: string; percentage: number }[];
}

export function LanguageUsage({ languages }: Props) {
  const max = languages.reduce((m, l) => Math.max(m, l.percentage), 0) || 1;

  return (
    <InsightWidget title="Language Usage" subtitle="From snippet languages">
      <div className="space-y-2">
        {languages.map((l) => (
          <BarRow key={l.name} label={l.name} value={l.percentage} max={max} suffix="%" />
        ))}
        {languages.length === 0 && (
          <p className="text-xs text-theme-text/40 text-center py-4">No snippets saved yet — save snippets to see language usage</p>
        )}
      </div>
    </InsightWidget>
  );
}
