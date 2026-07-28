import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaStar, FaRegStar, FaEye, FaTasks, FaBook, FaRocket, FaCog, FaFolder, FaTerminal, FaGitAlt, FaCube, FaPlay, FaCloudUploadAlt } from 'react-icons/fa';
import { useProjects } from '../hooks/useProjects';
import { useActiveProjectStore } from '../../../stores/activeProject.store';
import { useFileWatcher } from '../../file-watcher/useFileWatcher';
import { OverviewTab } from '../components/detail/OverviewTab';
import { TasksTab } from '../components/detail/TasksTab';
import { KnowledgeTab } from '../components/detail/KnowledgeTab';
import { WorkflowsTab } from '../components/detail/WorkflowsTab';
import { DeploymentsTab } from '../components/detail/DeploymentsTab';
import { SettingsTab } from '../components/detail/SettingsTab';
import { RunConfigsTab } from '../components/detail/RunConfigsTab';
import { GitTab } from '../components/detail/GitTab';
import { TerminalTab } from '../components/detail/TerminalTab';
import { DependenciesTab } from '../components/detail/DependenciesTab';
import type { Project } from '../types';
import { PROJECTS } from '../../../routes/types/routeConstants';
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
    ],
  },
  {
    label: 'Ship',
    tabs: [
      { id: 'run-configs', label: 'Run', icon: FaPlay },
      { id: 'deployments', label: 'Deployments', icon: FaCloudUploadAlt },
      { id: 'workflows', label: 'Workflows', icon: FaRocket },
    ],
  },
  {
    label: 'Settings',
    tabs: [{ id: 'settings', label: 'Settings', icon: FaCog }],
  },
];

const ALL_TABS = TAB_GROUPS.flatMap((g) => g.tabs);
type TabId = typeof ALL_TABS[number]['id'];

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getProject, toggleFavorite, updateLastOpened } = useProjects();
  const setActiveProject = useActiveProjectStore((s) => s.setActiveProject);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ALL_TABS.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam as TabId);
    }
  }, [searchParams]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await getProject(Number(id));
      setProject(p);
      if (p) {
        await updateLastOpened(p.id).catch(() => {});
        setActiveProject({ id: p.id, name: p.name, localPath: p.local_path || '' });
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
    return (
      <div className="text-center py-16">
        <FaFolder className="w-12 h-12 text-theme-text/10 mx-auto mb-3" />
        <p className="text-sm text-theme-text/40">Project not found</p>
        <button onClick={() => navigate(PROJECTS)} className="mt-4 px-4 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium">
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(PROJECTS)} className="p-2 rounded-lg hover:bg-theme-surface/50 text-theme-text/50 hover:text-theme-text transition-colors">
          <FaArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
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

      {/* Grouped tab bar */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 pb-0.5 border-b border-theme-border/10">
        {TAB_GROUPS.map((group) => (
          <div key={group.label} className="flex items-center gap-0.5">
            <span className="text-[10px] font-medium text-theme-text/30 uppercase tracking-wider mr-1 shrink-0">{group.label}</span>
            {group.tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    navigate(`/projects/${project.id}?tab=${tab.id}`, { replace: true });
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-all ${
                    isActive
                      ? 'text-theme-icon border-theme-icon'
                      : 'text-theme-text/40 border-transparent hover:text-theme-text/70 hover:border-theme-text/20'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div>
        {activeTab === 'overview' && <OverviewTab project={project} onRefresh={load} />}
        {activeTab === 'tasks' && <TasksTab projectId={project.id} />}
        {activeTab === 'knowledge' && <KnowledgeTab projectId={project.id} />}
        {activeTab === 'terminal' && <TerminalTab localPath={project.local_path} />}
        {activeTab === 'git' && <GitTab localPath={project.local_path} />}
        {activeTab === 'dependencies' && <DependenciesTab localPath={project.local_path} />}
        {activeTab === 'run-configs' && <RunConfigsTab projectId={project.id} localPath={project.local_path} />}
        {activeTab === 'deployments' && <DeploymentsTab project={project} />}
        {activeTab === 'workflows' && <WorkflowsTab project={project} />}
        {activeTab === 'settings' && <SettingsTab project={project} onRefresh={load} />}
      </div>
    </div>
  );
}
