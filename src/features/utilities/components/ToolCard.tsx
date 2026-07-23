import { FaStar, FaRegStar, FaClock } from 'react-icons/fa';
import type { ToolDefinition } from '../types';
import { useUtilitiesStore } from '../store/utilities.store';

interface Props {
  tool: ToolDefinition;
  isFavorite: boolean;
  isRecent: boolean;
}

export function ToolCard({ tool, isFavorite, isRecent }: Props) {
  const { setActiveTool, toggleFavorite, logRecentTool } = useUtilitiesStore();
  const Icon = tool.icon;

  const handleOpen = () => {
    logRecentTool(tool.id);
    setActiveTool(tool.id);
  };

  return (
    <div
      onClick={handleOpen}
      className="group relative bg-theme-surface border border-theme-border/20 rounded-xl p-4 cursor-pointer hover:border-theme-icon/30 hover:shadow-sm transition-all"
    >
      <button
        onClick={(e) => { e.stopPropagation(); toggleFavorite(tool.id); }}
        className="absolute top-3 right-3 text-theme-text/20 hover:text-amber-400 transition-colors"
      >
        {isFavorite ? <FaStar className="w-3.5 h-3.5 text-amber-400" /> : <FaRegStar className="w-3.5 h-3.5" />}
      </button>

      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-theme-icon/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-theme-icon" />
        </div>
        <div className="min-w-0 flex-1 pr-4">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-theme-text truncate">{tool.name}</h4>
            {isRecent && <FaClock className="w-3 h-3 text-theme-text/20 shrink-0" title="Recently used" />}
          </div>
          <p className="text-[11px] text-theme-text/40 mt-0.5 line-clamp-2">{tool.description}</p>
        </div>
      </div>
    </div>
  );
}
