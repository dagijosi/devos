import { useNavigate, Link } from 'react-router-dom';
import { FaPlus, FaFolder, FaClock, FaArrowRight, FaRocket } from 'react-icons/fa';
import { useProjects } from '../features/projects/hooks/useProjects';
import { ProjectCard } from '../features/projects/components/ProjectCard';
import { DeveloperInbox } from '../features/dashboard/components/DeveloperInbox';
import { PROJECT_FORM, PROJECTS } from '../routes/types/routeConstants';
import type { Project } from '../features/projects/types';

function timeAgo(date?: string | null): string {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return 'just now';
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function HomePage() {
  const navigate = useNavigate();
  const { projects, loading, toggleFavorite } = useProjects();

  const ordered = [...projects].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    if (Boolean(a.favorite) !== Boolean(b.favorite)) return a.favorite ? -1 : 1;
    const la = a.last_opened ? new Date(a.last_opened).getTime() : 0;
    const lb = b.last_opened ? new Date(b.last_opened).getTime() : 0;
    return lb - la;
  });

  const recent = ordered.filter((p) => p.last_opened).slice(0, 3);
  const starred = ordered.filter((p) => p.pinned || p.favorite).slice(0, 6);
  const rest = ordered.filter((p) => !p.pinned && !p.favorite && !p.last_opened).slice(0, 6);

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-theme-icon/10 via-theme-surface to-theme-background border border-theme-border/20 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium text-theme-icon/70 uppercase tracking-widest mb-1">DevOS</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-theme-text tracking-tight">Pick up where you left off</h1>
            <p className="text-sm text-theme-text/45 mt-1.5 max-w-lg">
              Choose a project to open its workspace — tasks, code, ship and settings all scoped to it.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate(PROJECT_FORM)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors shadow-lg shadow-theme-icon/20"
            >
              <FaPlus className="w-3.5 h-3.5" /> New Project
            </button>
            <button
              onClick={() => navigate(PROJECTS)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-theme-surface border border-theme-border/20 text-theme-text/70 hover:text-theme-icon hover:border-theme-icon/30 transition-colors"
            >
              <FaFolder className="w-3.5 h-3.5" /> All Projects
            </button>
          </div>
        </div>
      </div>

      {/* Cross-project inbox */}
      <DeveloperInbox />

      {/* Recent */}
      {recent.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FaClock className="w-3.5 h-3.5 text-theme-text/40" />
            <h2 className="text-sm font-semibold text-theme-text">Recently opened</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {recent.map((p: Project) => (
              <ProjectCard key={p.id} project={p} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        </section>
      )}

      {/* Starred / pinned */}
      {starred.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FaRocket className="w-3.5 h-3.5 text-yellow-400" />
            <h2 className="text-sm font-semibold text-theme-text">Pinned & favorites</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {starred.map((p: Project) => (
              <ProjectCard key={p.id} project={p} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        </section>
      )}

      {/* All projects quick list */}
      {!loading && projects.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-theme-text">All projects</h2>
            <Link to={PROJECTS} className="inline-flex items-center gap-1 text-xs text-theme-icon/70 hover:text-theme-icon transition-colors">
              Browse all <FaArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
          <div className="bg-theme-surface border border-theme-border/20 rounded-2xl divide-y divide-theme-border/5 overflow-hidden">
            {rest.concat(recent, starred).slice(0, 8).map((p: Project) => (
              <button
                key={p.id}
                onClick={() => navigate(`${PROJECTS}/${p.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-theme-background/20 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-theme-icon/10 flex items-center justify-center shrink-0">
                  <FaFolder className="w-4 h-4 text-theme-icon/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-theme-text truncate">{p.name}</p>
                  <p className="text-[11px] text-theme-text/35 truncate">{p.local_path || p.description || p.category}</p>
                </div>
                {p.last_opened && <span className="text-[10px] text-theme-text/30 shrink-0">{timeAgo(p.last_opened)}</span>}
                <FaArrowRight className="w-3 h-3 text-theme-text/20 shrink-0" />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
