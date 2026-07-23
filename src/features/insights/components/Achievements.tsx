import { InsightWidget } from './InsightWidget';

interface Achievement {
  label: string;
  unlocked: boolean;
}

interface Props {
  achievements: Achievement[];
}

export function Achievements({ achievements }: Props) {
  return (
    <InsightWidget title="Achievements" subtitle="Milestones reached">
      <div className="grid grid-cols-2 gap-2">
        {achievements.map((a) => (
          <div key={a.label} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
            a.unlocked
              ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
              : 'border-theme-border/10 text-theme-text/30'
          }`}>
            <span className="text-sm">{a.unlocked ? '✓' : '○'}</span>
            <span className="truncate">{a.label}</span>
          </div>
        ))}
        {achievements.length === 0 && (
          <p className="text-xs text-theme-text/40 text-center py-4 col-span-2">No achievements yet</p>
        )}
      </div>
    </InsightWidget>
  );
}
