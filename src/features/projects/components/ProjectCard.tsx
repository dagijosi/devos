import { useNavigate } from 'react-router-dom';
import { FaFolder, FaStar, FaRegStar, FaArrowRight, FaStickyNote, FaTasks, FaBug, FaCode } from 'react-icons/fa';
import type { Project } from '../types';
import { TechnologyBadge } from './TechnologyBadge';
import { PROJECTS } from '../../../routes/types/routeConstants';

interface Props {
  project: Project;
  onToggleFavorite: (id: number) => void;
}

const statusConfig = {
  active: { dot: 'bg-green-400', label: 'Healthy', text: 'text-green-400' },
  completed: { dot: 'bg-blue-400', label: 'Completed', text: 'text-blue-400' },
  archived: { dot: 'bg-gray-400', label: 'Archived', text: 'text-gray-400' },
};

export function ProjectCard({ project, onToggleFavorite }: Props) {
  const navigate = useNavigate();
  const status = statusConfig[project.status];
  const techs = (project.technology || []).slice(0, 3);
  const lastOpened = project.last_opened
    ? (() => {
        const diff = Date.now() - new Date(project.last_opened).getTime();
        const hrs = Math.floor(diff / 3600000);
        if (hrs < 1) return 'Just now';
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
      })()
    : null;

  return (
    <div className="group bg-theme-surface border border-theme-border/20 hover:border-theme-border/40 rounded-2xl transition-all overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-theme-icon/10 flex items-center justify-center shrink-0">
              <FaFolder className="w-5 h-5 text-theme-icon" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-theme-text truncate">{project.name}</h3>
              {project.description && (
                <p className="text-xs text-theme-text/40 truncate max-w-[200px]">{project.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onToggleFavorite(project.id); }}
            className="p-1.5 rounded-lg hover:bg-yellow-400/10 transition-colors opacity-0 group-hover:opacity-100"
          >
            {project.favorite ? <FaStar className="w-3.5 h-3.5 text-yellow-400" /> : <FaRegStar className="w-3.5 h-3.5 text-theme-text/30" />}
          </button>
        </div>

        {techs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {techs.map(t => <TechnologyBadge key={t} name={t} />)}
          </div>
        )}

        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${status.dot}`} />
            <span className={`text-[10px] font-medium ${status.text}`}>{status.label}</span>
          </div>
          {lastOpened && (
            <span className="text-[10px] text-theme-text/30">Last open {lastOpened}</span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-theme-border/10">
          <div className="flex items-center gap-1 text-[10px] text-theme-text/40">
            <FaStickyNote className="w-3 h-3" /> {project.note_count ?? 0}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-theme-text/40">
            <FaTasks className="w-3 h-3" /> {project.task_count ?? 0}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-theme-text/40">
            <FaBug className="w-3 h-3" /> {project.bug_count ?? 0}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-theme-text/40">
            <FaCode className="w-3 h-3" /> {project.snippet_count ?? 0}
          </div>
          <button
            onClick={() => navigate(`${PROJECTS}/${project.id}`)}
            className="ml-auto flex items-center gap-1 text-[10px] text-theme-icon/60 hover:text-theme-icon transition-colors"
          >
            Open <FaArrowRight className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
