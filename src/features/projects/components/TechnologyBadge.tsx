import { getTechnologyColor } from '../utils/techDetector';

interface Props {
  name: string;
  size?: 'sm' | 'md';
}

export function TechnologyBadge({ name, size = 'sm' }: Props) {
  const color = getTechnologyColor(name);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-medium ${
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
      }`}
      style={{
        backgroundColor: `${color}18`,
        color,
        border: `1px solid ${color}30`,
      }}
    >
      {name}
    </span>
  );
}
