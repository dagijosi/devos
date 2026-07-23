import { FaArrowLeft, FaStar, FaRegStar } from 'react-icons/fa';
import { useToolboxStore } from '../store/toolbox.store';
import type { ToolDefinition } from '../types';

interface ToolShellProps {
  tool: ToolDefinition;
  children: React.ReactNode;
}

export function ToolShell({ tool, children }: ToolShellProps) {
  const { favoriteTools, toggleFavorite, setActiveTool } = useToolboxStore();
  const isFavorite = favoriteTools.includes(tool.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTool(null)}
          className="flex items-center gap-2 text-sm text-theme-text/50 hover:text-theme-text transition-colors p-2 -ml-2 rounded-xl hover:bg-theme-surface/60"
        >
          <FaArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-theme-icon flex items-center justify-center">
            <tool.icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-theme-text">{tool.name}</h2>
            <p className="text-xs text-theme-text/50">{tool.description}</p>
          </div>
        </div>
        <button
          onClick={() => toggleFavorite(tool.id)}
          className="ml-auto p-2 rounded-xl hover:bg-theme-surface/60 transition-colors"
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? (
            <FaStar className="w-4 h-4 text-yellow-400" />
          ) : (
            <FaRegStar className="w-4 h-4 text-theme-text/40" />
          )}
        </button>
      </div>
      <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5">
        {children}
      </div>
    </div>
  );
}
