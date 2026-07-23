import type { ReactNode } from 'react';
import { FaArrowLeft, FaStar, FaRegStar } from 'react-icons/fa';
import { useUtilitiesStore } from '../store/utilities.store';

interface Props {
  name: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
  toolId: string;
}

export function ToolShell({ name, description, icon, children, toolId }: Props) {
  const { setActiveTool, toggleFavorite, favoriteTools, logRecentTool } = useUtilitiesStore();
  const isFav = favoriteTools.includes(toolId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveTool(null)} className="p-2 rounded-xl bg-theme-surface border border-theme-border/20 text-theme-text/40 hover:text-theme-text transition-colors">
          <FaArrowLeft className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          {icon}
          <div>
            <h2 className="text-sm font-semibold text-theme-text">{name}</h2>
            <p className="text-[11px] text-theme-text/40">{description}</p>
          </div>
        </div>
        <button
          onClick={() => { toggleFavorite(toolId); logRecentTool(toolId); }}
          className={`p-2 rounded-xl border transition-colors ${isFav ? 'border-amber-500/20 text-amber-400' : 'border-theme-border/20 text-theme-text/30 hover:text-amber-400'}`}
        >
          {isFav ? <FaStar className="w-4 h-4" /> : <FaRegStar className="w-4 h-4" />}
        </button>
      </div>
      <div className="bg-theme-surface border border-theme-border/20 rounded-2xl p-5">
        {children}
      </div>
    </div>
  );
}
