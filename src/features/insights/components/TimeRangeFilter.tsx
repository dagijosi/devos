import type { TimeRange } from '../types';

const OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom' },
];

interface Props {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export function TimeRangeFilter({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 bg-theme-background/50 border border-theme-border/20 rounded-xl p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            value === opt.value
              ? 'bg-theme-icon text-white shadow-sm'
              : 'text-theme-text/50 hover:text-theme-text'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
