import type { ReactElement } from 'react';
import { FaPlus } from 'react-icons/fa';

interface Props {
  icon: ReactElement;
  title: string;
  description?: string;
  cta?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, cta }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-4">
      <div className="w-14 h-14 rounded-2xl bg-theme-background/50 flex items-center justify-center mb-4 text-theme-text/20">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-theme-text mb-1">{title}</h3>
      {description && <p className="text-xs text-theme-text/40 text-center max-w-sm mb-4">{description}</p>}
      {cta && (
        <button onClick={cta.onClick}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-theme-icon text-white rounded-xl hover:bg-theme-icon/90 transition-colors">
          <FaPlus className="w-3 h-3" /> {cta.label}
        </button>
      )}
    </div>
  );
}
