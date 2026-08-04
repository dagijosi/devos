import { useNavigate } from 'react-router-dom';
import { FaStar, FaRegStar, FaArrowRight } from 'react-icons/fa';
import type { Project } from '../types';
import { TechnologyBadge } from './TechnologyBadge';
import { ProjectIcon } from './ProjectIcon';
import { PROJECTS } from '../../../routes/types/routeConstants';

interface Props {
  project: Project;
  onToggleFavorite: (id: number) => void;
}

const statusConfig = {
  active: { dot: 'bg-emerald-400', label: 'Active' },
  completed: { dot: 'bg-sky-400', label: 'Completed' },
  archived: { dot: 'bg-zinc-400', label: 'Archived' },
};

function timeAgo(date?: string | null): string {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ProjectCard({ project, onToggleFavorite }: Props) {
  const navigate = useNavigate();
  const status = statusConfig[project.status];

  const techArr = Array.isArray(project.technology)
    ? project.technology
    : typeof project.technology === 'string'
      ? (() => { try { return JSON.parse(project.technology); } catch { return []; } })()
      : [];
  const techs = techArr.slice(0, 3);
  const restCount = techArr.length - techs.length;

  const tagArr = Array.isArray(project.tags)
    ? project.tags
    : typeof project.tags === 'string'
      ? (() => { try { return JSON.parse(project.tags); } catch { return []; } })()
      : [];
  const tags = tagArr.slice(0, 3);
  const restTagCount = tagArr.length - tags.length;

  const lastOpened = timeAgo(project.last_opened);
  const updated = timeAgo(project.updated_at);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`${PROJECTS}/${project.id}`)}
      onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(`${PROJECTS}/${project.id}`); } }}
      className="group flex flex-col bg-theme-surface border border-theme-border/20 hover:border-theme-icon/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-icon rounded-2xl transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
    >
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <ProjectIcon
              icon={project.icon}
              color={project.color}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              iconClassName="w-[18px] h-[18px]"
            />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-theme-text truncate">{project.name}</h3>
              {project.description && (
                <p className="text-xs text-theme-text/40 truncate mt-0.5">{project.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onToggleFavorite(project.id); }}
            aria-label={project.favorite ? `Remove ${project.name} from favorites` : `Add ${project.name} to favorites`}
            className={`p-1.5 -m-1 rounded-lg transition-colors ${
              project.favorite
                ? 'text-yellow-400 hover:bg-yellow-400/10'
                : 'text-theme-text/25 opacity-0 group-hover:opacity-100 hover:bg-yellow-400/10 hover:text-yellow-400'
            }`}
          >
            {project.favorite ? <FaStar className="w-3.5 h-3.5" /> : <FaRegStar className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex-1 flex flex-wrap content-start items-center gap-1.5 mt-4 pb-1">
          {techs.map((t: string) => <TechnologyBadge key={t} name={t} />)}
          {tags.map((t: string) => (
            <span key={t} className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-theme-border/10 text-theme-text/50">
              #{t}
            </span>
          ))}
          {restCount > 0 && <span className="text-[10px] text-theme-text/30">+{restCount}</span>}
          {restTagCount > 0 && <span className="text-[10px] text-theme-text/30">+{restTagCount}</span>}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-theme-border/10">
          <span className="flex items-center gap-1.5 text-[11px] text-theme-text/50">
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          <span className="text-[11px] text-theme-text/30">
            {lastOpened ? `Opened ${lastOpened}` : updated ? `Updated ${updated}` : 'Not opened yet'}
          </span>
          <FaArrowRight className="w-3 h-3 text-theme-text/25 group-hover:text-theme-icon group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </div>
  );
}
