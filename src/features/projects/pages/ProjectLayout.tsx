import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Outlet, Navigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { FaStar, FaRegStar, FaEye, FaTasks, FaBook, FaRocket, FaCog, FaFolder, FaTerminal, FaGitAlt, FaCube, FaKey, FaPlay, FaCloudUploadAlt, FaLink } from 'react-icons/fa';
import { useProjects } from '../hooks/useProjects';
import { useActiveProjectStore } from '../../../stores/activeProject.store';
import { useFileWatcher } from '../../file-watcher/useFileWatcher';
import type { Project } from '../types';
import { PROJECTS } from '../../../routes/types/routeConstants';
import { PROJECT_TAB_ROUTES } from '../../../routes/types/routeConstants';
import { setProjectContext } from '../utils/projectContext';

interface TabGroup {
  label: string;
  tabs: { id: string; label: string; icon: React.ElementType }[];
}

const TAB_GROUPS: TabGroup[] = [
  {
    label: 'Overview',
    tabs: [{ id: 'overview', label: 'Overview', icon: FaEye }],
  },
  {
    label: 'Work',
    tabs: [
      { id: 'tasks', label: 'Tasks', icon: FaTasks },
      { id: 'knowledge', label: 'Knowledge', icon: FaBook },
    ],
  },
  {
    label: 'Code',
    tabs: [
      { id: 'terminal', label: 'Terminal', icon: FaTerminal },
      { id: 'git', label: 'Git', icon: FaGitAlt },
      { id: 'dependencies', label: 'Dependencies', icon: FaCube },
      { id: 'environment', label: 'Environment', icon: FaKey },
    ],
  },
  {
    label: 'Ship',
    tabs: [
      { id: 'run-configs', label: 'Run', icon: FaPlay },
      { id: 'deployments', label: 'Deployments', icon: FaCloudUploadAlt },
      { id: 'workflows', label: 'Workflows', icon: FaRocket },
      { id: 'apis', label: 'APIs', icon: FaLink },
    ],
  },
  {
    label: 'Settings',
    tabs: [{ id: 'settings', label: 'Settings', icon: FaCog }],
  },
];

export function ProjectLayout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
      <div className="space-y-5">
        <div className="h-8 w-24 bg-theme-border/10 rounded animate-pulse" />
        <div className="h-48 bg-theme-surface border border-theme-border/30 rounded-2xl animate-pulse p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-theme-border/20" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-theme-border/20 rounded w-1/3" />
              <div className="h-4 bg-theme-border/20 rounded w-1/2" />
            </div>
          </div>
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
  const visibleGroups = TAB_GROUPS
    .map((group) => ({
      ...group,
      tabs: group.tabs.filter((t) => {
        if (t.id === 'overview' || t.id === 'settings') return true;
        return moduleSet ? moduleSet.has(t.id) : true;
      }),
    }))
    .filter((g) => g.tabs.length > 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-theme-surface/50 text-theme-text/50 hover:text-theme-text transition-colors" title="Back to Home">
          <FaFolder className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link to={`/projects`} className="text-xs text-theme-text/40 hover:text-theme-icon transition-colors">
              All Projects
            </Link>
            <span className="text-theme-text/20">/</span>
            <h1 className="text-lg font-bold text-theme-text truncate">{project.name}</h1>
            {watching && <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-green-400 bg-green-400/10 rounded"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> watching</span>}
            <button onClick={() => toggleFavorite(project.id)}
              className="p-1 rounded-lg hover:bg-yellow-400/10 transition-colors">
              {project.favorite ? <FaStar className="w-4 h-4 text-yellow-400" /> : <FaRegStar className="w-4 h-4 text-theme-text/30" />}
            </button>
          </div>
          {project.description && <p className="text-xs text-theme-text/40 truncate">{project.description}</p>}
        </div>
      </div>

      {/* Grouped tab bar → real nested routes */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 pb-0.5 border-b border-theme-border/10">
        {visibleGroups.map((group) => (
          <div key={group.label} className="flex items-center gap-0.5">
            <span className="text-[10px] font-medium text-theme-text/30 uppercase tracking-wider mr-1 shrink-0">{group.label}</span>
            {group.tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const href = (PROJECT_TAB_ROUTES[tab.id] || PROJECT_TAB_ROUTES.overview).replace(':id', String(project.id));
              return (
                <Link
                  key={tab.id}
                  to={href}
                  className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-all ${
                    isActive
                      ? 'text-theme-icon border-theme-icon'
                      : 'text-theme-text/40 border-transparent hover:text-theme-text/70 hover:border-theme-text/20'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div>
        <Outlet context={{ project, onRefresh: load }} />
      </div>
    </div>
  );
}
