import { useNavigate } from 'react-router-dom';
import { FaCircle, FaChevronRight, FaFolder } from 'react-icons/fa';
import { PROJECTS } from '../../../routes/types/routeConstants';
import type { Project } from '../../projects/types';

interface ProjectHealthProps {
  projects: Project[];
  loading?: boolean;
}

const statusIndicator = (status: string) => {
  switch (status) {
    case 'active': return { color: 'text-green-400', label: 'Running' };
    case 'completed': return { color: 'text-blue-400', label: 'Completed' };
    default: return { color: 'text-gray-400', label: 'Archived' };
  }
};

export function ProjectHealth({ projects, loading }: ProjectHealthProps) {
  const navigate = useNavigate();
  const items = projects.slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 p-3 bg-theme-background/30 rounded-xl animate-pulse">
            <div className="w-3 h-3 rounded-full bg-theme-border/20" />
            <div className="flex-1"><div className="h-3 bg-theme-border/20 rounded w-2/3" /></div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <FaFolder className="w-8 h-8 text-theme-text/20 mx-auto mb-2" />
        <p className="text-xs text-theme-text/40">No projects yet</p>
        <button onClick={() => navigate(`${PROJECTS}?new=true`)} className="mt-3 text-xs text-theme-icon hover:text-theme-icon/80 transition-colors">Create your first project</button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map(p => {
        const indicator = statusIndicator(p.status);
        return (
          <div
            key={p.id}
            onClick={() => navigate(`${PROJECTS}/${p.id}`)}
            className="flex items-center gap-3 p-3 rounded-xl bg-theme-background/30 hover:bg-theme-background/50 border border-theme-border/10 hover:border-theme-border/30 transition-all cursor-pointer group"
          >
            <FaCircle className={`w-2.5 h-2.5 shrink-0 ${indicator.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-theme-text truncate">{p.name}</p>
              <p className="text-[10px] text-theme-text/40">{indicator.label}</p>
            </div>
            <FaChevronRight className="w-3 h-3 text-theme-text/20 group-hover:text-theme-text/50 transition-colors shrink-0" />
          </div>
        );
      })}
    </div>
  );
}
