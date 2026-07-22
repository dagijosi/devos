import { FaBug, FaRegTrashAlt, FaExternalLinkAlt } from 'react-icons/fa';
import type { Bug } from '../types';

interface Props {
  bug: Bug;
  onSelect: (bug: Bug) => void;
  onDelete: (id: number) => void;
}

export function BugCard({ bug, onSelect, onDelete }: Props) {
  const statusColors: Record<string, string> = {
    open: 'bg-red-500/10 text-red-400 border-red-500/30',
    'in-progress': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    resolved: 'bg-green-500/10 text-green-400 border-green-500/30',
    closed: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  };
  const statusClass = statusColors[bug.status] || statusColors.open;

  return (
    <div onClick={() => onSelect(bug)}
      className="bg-theme-surface border border-theme-border/30 rounded-2xl p-4 hover:border-theme-border/60 transition-colors cursor-pointer group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <FaBug className="w-4 h-4 text-red-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-theme-text truncate">{bug.title}</h3>
            <p className="text-xs text-theme-text/40 line-clamp-1 mt-0.5">{bug.problem}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${statusClass}`}>{bug.status}</span>
          <button onClick={(e) => { e.stopPropagation(); onDelete(bug.id); }}
            className="p-1.5 rounded-lg text-theme-text/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
            <FaRegTrashAlt className="w-3 h-3" />
          </button>
        </div>
      </div>

      {bug.tags.length > 0 && (
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {bug.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-theme-background/50 text-theme-text/40">#{tag}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-theme-border/10">
        <span className="text-[10px] text-theme-text/30">{new Date(bug.created_at).toLocaleDateString()}</span>
        <span className="text-[10px] text-theme-icon/50 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          Details <FaExternalLinkAlt className="w-2.5 h-2.5" />
        </span>
      </div>
    </div>
  );
}
