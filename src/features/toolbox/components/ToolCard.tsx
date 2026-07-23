import { FaStar, FaRegStar, FaClock } from 'react-icons/fa';
import { useToolboxStore } from '../store/toolbox.store';
import type { ToolDefinition } from '../types';

interface ToolCardProps {
  tool: ToolDefinition;
  isRecent?: boolean;
}

export function ToolCard({ tool, isRecent }: ToolCardProps) {
  const { favoriteTools, toggleFavorite, setActiveTool } = useToolboxStore();
  const isFavorite = favoriteTools.includes(tool.id);
  const Icon = tool.icon;

  return (
    <button
      onClick={() => setActiveTool(tool.id)}
      className="relative bg-theme-surface border border-theme-border/30 rounded-2xl p-5 text-left hover:border-theme-border/60 transition-all duration-200 group cursor-pointer w-full hover:shadow-lg hover:shadow-black/5"
    >
      {isRecent && (
        <FaClock className="absolute top-3 right-3 w-3 h-3 text-theme-text/30" />
      )}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-theme-icon flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-theme-text truncate">{tool.name}</h3>
          <p className="text-sm text-theme-text/50 mt-0.5 line-clamp-2">{tool.description}</p>
          {tool.shortcut && (
            <span className="inline-block mt-2 text-[10px] font-mono text-theme-text/30 bg-theme-background px-1.5 py-0.5 rounded border border-theme-border/20">
              {tool.shortcut}
            </span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(tool.id); }}
          className="p-1.5 rounded-lg hover:bg-theme-border/20 transition-colors flex-shrink-0 mt-0.5"
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? (
            <FaStar className="w-3.5 h-3.5 text-yellow-400" />
          ) : (
            <FaRegStar className="w-3.5 h-3.5 text-theme-text/30 group-hover:text-theme-text/50" />
          )}
        </button>
      </div>
    </button>
  );
}
