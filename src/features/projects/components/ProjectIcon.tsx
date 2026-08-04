import { FaFolder, FaReact, FaCode, FaRocket, FaBox, FaDatabase, FaMobileAlt, FaServer } from 'react-icons/fa';

const ICON_MAP: Record<string, React.ElementType> = {
  folder: FaFolder,
  react: FaReact,
  code: FaCode,
  rocket: FaRocket,
  box: FaBox,
  database: FaDatabase,
  mobile: FaMobileAlt,
  'next.js': FaServer,
  node: FaServer,
  go: FaServer,
  rust: FaCode,
  python: FaCode,
  vite: FaRocket,
};

interface Props {
  icon?: string | null;
  color?: string | null;
  className?: string;
  iconClassName?: string;
}

export function ProjectIcon({ icon, color, className, iconClassName }: Props) {
  const Icon = ICON_MAP[(icon || 'folder').toLowerCase()] || FaFolder;
  const c = color || '#6366f1';
  return (
    <div className={className} style={{ backgroundColor: `${c}1a`, color: c }}>
      <Icon className={iconClassName} />
    </div>
  );
}
