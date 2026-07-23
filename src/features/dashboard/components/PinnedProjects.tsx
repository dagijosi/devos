import { useNavigate } from 'react-router-dom';
import { FaStar, FaFolder, FaArrowRight } from 'react-icons/fa';
import { PROJECTS } from '../../../routes/types/routeConstants';
import type { Project } from '../../projects/types';

interface PinnedProjectsProps {
  projects: Project[];
  loading?: boolean;
  onTogglePin: (id: number) => void;
}

const statusColor = (status: string) => {
  switch (status) {
    case 'active': return 'text-green-400 bg-green-500/10';
    case 'completed': return 'text-blue-400 bg-blue-500/10';
    default: return 'text-gray-400 bg-gray-500/10';
  }
};

export function PinnedProjects({ projects, loading, onTogglePin }: PinnedProjectsProps) {
  const navigate = useNavigate();
  const pinned = projects.filter(p => p.favorite || p.pinned).slice(0, 4);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map(i => (
          <div key={i} className="p-4 bg-theme-background/30 rounded-xl animate-pulse">
            <div className="h-4 bg-theme-border/20 rounded w-3/4 mb-2" />
            <div className="h-3 bg-theme-border/20 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (pinned.length === 0) {
    return (
      <div className="text-center py-8">
        <FaStar className="w-8 h-8 text-theme-text/20 mx-auto mb-2" />
        <p className="text-xs text-theme-text/40">Star projects for quick access</p>
        <button onClick={() => navigate(PROJECTS)} className="mt-2 text-xs text-theme-icon hover:text-theme-icon/80 transition-colors">Browse projects</button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {pinned.map(p => (
        <div key={p.id} className="group relative p-4 rounded-xl bg-theme-background/30 border border-theme-border/10 hover:border-theme-border/30 transition-all cursor-pointer"
          onClick={() => navigate(`${PROJECTS}/${p.id}`)}
        >
          <button
            onClick={e => { e.stopPropagation(); onTogglePin(p.id); }}
            className="absolute top-2 right-2 p-1 rounded-lg text-yellow-400 hover:bg-yellow-400/10 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <FaStar className="w-3 h-3 fill-current" />
          </button>
          <FaFolder className="w-5 h-5 text-theme-icon mb-2" />
          <p className="text-sm font-medium text-theme-text truncate pr-4">{p.name}</p>
          <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full mt-1.5 ${statusColor(p.status)}`}>{p.status}</span>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-theme-text/30 group-hover:text-theme-icon/60 transition-colors">
            <FaArrowRight className="w-2.5 h-2.5" /> Open
          </div>
        </div>
      ))}
    </div>
  );
}
