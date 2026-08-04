import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, Outlet, Navigate, Link } from 'react-router-dom';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { useProjects } from '../hooks/useProjects';
import { useActiveProjectStore } from '../../../stores/activeProject.store';
import { useFileWatcher } from '../../file-watcher/useFileWatcher';
import type { Project } from '../types';
import { HOME, PROJECTS, PROJECT_TAB_ROUTES } from '../../../routes/types/routeConstants';
import { setProjectContext } from '../utils/projectContext';
import { ProjectIcon } from '../components/ProjectIcon';

const TABS: { id: string; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'knowledge', label: 'Knowledge' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'git', label: 'Git' },
  { id: 'dependencies', label: 'Dependencies' },
  { id: 'environment', label: 'Environment' },
  { id: 'run-configs', label: 'Run' },
  { id: 'deployments', label: 'Deployments' },
  { id: 'workflows', label: 'Workflows' },
  { id: 'apis', label: 'APIs' },
  { id: 'settings', label: 'Settings' },
];

const statusDot = {
  active: 'bg-emerald-400',
  completed: 'bg-sky-400',
  archived: 'bg-zinc-400',
};

export function ProjectLayout() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { getProject, toggleFavorite, updateLastOpened } = useProjects();
  const setActiveProject = useActiveProjectStore((s) => s.setActiveProject);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await getProject(Number(id));
      setProject(p);
      if (p) {
        await updateLastOpened(p.id).catch(() => {});
        setActiveProject({ id: p.id, name: p.name, localPath: p.local_path || '', enabledModules: p.enabled_modules });
        setProjectContext(p);
      }
    } catch {
      setProject(null);
    }
    setLoading(false);
  }, [id, getProject, updateLastOpened, setActiveProject]);

  useEffect(() => { load(); }, [load]);

  const { watching } = useFileWatcher(project?.local_path || null);

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-3 w-32 bg-theme-border/10 rounded" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-theme-border/20" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 bg-theme-border/20 rounded" />
            <div className="h-3 w-64 bg-theme-border/10 rounded" />
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-7 w-16 bg-theme-border/10 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!project) {
    return <Navigate to={PROJECTS} replace />;
  }

  const base = `/projects/${project.id}`;
  const activeSegment = location.pathname.replace(base, '').replace(/^\//, '');
  const activeTab = activeSegment === '' ? 'overview' : activeSegment;

  const moduleSet = project.enabled_modules ? new Set(project.enabled_modules) : null;
  const visibleTabs = TABS.filter((t) => {
    if (t.id === 'overview' || t.id === 'settings') return true;
    return moduleSet ? moduleSet.has(t.id) : true;
  });

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-theme-text/40">
        <Link to={HOME} className="hover:text-theme-text transition-colors">Home</Link>
        <span className="text-theme-text/20">/</span>
        <Link to={PROJECTS} className="hover:text-theme-text transition-colors">All Projects</Link>
        <span className="text-theme-text/20">/</span>
        <span className="text-theme-text/70 font-medium truncate">{project.name}</span>
      </div>

      {/* Title row */}
      <div className="flex items-center gap-3.5">
        <ProjectIcon
          icon={project.icon}
          color={project.color}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          iconClassName="w-[18px] h-[18px]"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-theme-text leading-tight truncate">{project.name}</h1>
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot[project.status]}`} title={project.status} />
            {watching && <span className="text-[10px] text-green-400/80">● watching</span>}
          </div>
          {project.description && (
            <p className="text-xs text-theme-text/40 mt-0.5 truncate">{project.description}</p>
          )}
        </div>
        <button
          onClick={() => toggleFavorite(project.id)}
          aria-label={project.favorite ? 'Remove from favorites' : 'Add to favorites'}
          className={`p-2 -m-2 rounded-lg transition-colors ${
            project.favorite
              ? 'text-yellow-400 hover:bg-yellow-400/10'
              : 'text-theme-text/30 hover:bg-yellow-400/10 hover:text-yellow-400'
          }`}
        >
          {project.favorite ? <FaStar className="w-4 h-4" /> : <FaRegStar className="w-4 h-4" />}
        </button>
      </div>

      {/* Tab chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const href = (PROJECT_TAB_ROUTES[tab.id] || PROJECT_TAB_ROUTES.overview).replace(':id', String(project.id));
          return (
            <Link
              key={tab.id}
              to={href}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                isActive
                  ? 'bg-theme-icon/10 text-theme-icon'
                  : 'bg-theme-surface text-theme-text/40 border border-theme-border/10 hover:border-theme-border/30 hover:text-theme-text/70'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div>
        <Outlet context={{ project, onRefresh: load }} />
      </div>
    </div>
  );
}
