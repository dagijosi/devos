import { FaFolder, FaStar, FaRegStar, FaThumbtack, FaRegTrashAlt, FaExternalLinkAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../types';
import { TechnologyBadge } from './TechnologyBadge';
import { PROJECTS } from '../../../routes/types/routeConstants';

interface Props {
  project: Project;
  onToggleFavorite: (id: number) => void;
  onTogglePinned: (id: number) => void;
  onDelete: (id: number) => void;
}

export function ProjectCard({ project, onToggleFavorite, onTogglePinned, onDelete }: Props) {
  const navigate = useNavigate();
  const techs = project.technology.slice(0, 3);

  return (
    <div
      className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5 hover:border-theme-border/60 transition-colors group cursor-pointer"
      onClick={() => navigate(`${PROJECTS}/${project.id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <FaFolder className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-theme-text truncate">{project.name}</h3>
            {project.description && (
              <p className="text-xs text-theme-text/50 mt-0.5 line-clamp-1">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onTogglePinned(project.id); }}
            className={`p-1.5 rounded-lg transition-colors ${project.pinned ? 'text-yellow-400' : 'text-theme-text/30 hover:text-yellow-400'}`}
            title={project.pinned ? 'Unpin' : 'Pin'}
          >
            <FaThumbtack className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(project.id); }}
            className={`p-1.5 rounded-lg transition-colors ${project.favorite ? 'text-yellow-400' : 'text-theme-text/30 hover:text-yellow-400'}`}
            title={project.favorite ? 'Unfavorite' : 'Favorite'}
          >
            {project.favorite ? <FaStar className="w-3.5 h-3.5" /> : <FaRegStar className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
            className="p-1.5 rounded-lg text-theme-text/30 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <FaRegTrashAlt className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap min-h-[22px]">
        {techs.map((t) => <TechnologyBadge key={t} name={t} />)}
        {project.technology.length > 3 && (
          <span className="text-[10px] text-theme-text/40">+{project.technology.length - 3}</span>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-theme-border/10 text-xs text-theme-text/40">
        <span className={`px-2 py-0.5 rounded-full font-medium ${
          project.status === 'active' ? 'bg-green-500/10 text-green-400' :
          project.status === 'completed' ? 'bg-blue-500/10 text-blue-400' :
          'bg-gray-500/10 text-gray-400'
        }`}>
          {project.status}
        </span>
        <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <FaExternalLinkAlt className="w-2.5 h-2.5" />
          Details
        </span>
      </div>
    </div>
  );
}
