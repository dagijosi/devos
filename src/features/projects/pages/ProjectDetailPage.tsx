import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaStar, FaRegStar, FaEye, FaTasks, FaBook, FaLink, FaPlay, FaCloudUploadAlt, FaCog, FaFolder, FaWrench, FaTerminal, FaGitAlt, FaCube } from 'react-icons/fa';
import { useProjects } from '../hooks/useProjects';
import { useFileWatcher } from '../../file-watcher/useFileWatcher';
import { OverviewTab } from '../components/detail/OverviewTab';
import { TasksTab } from '../components/detail/TasksTab';
import { KnowledgeTab } from '../components/detail/KnowledgeTab';
import { ApisTab } from '../components/detail/ApisTab';
import { WorkflowsTab } from '../components/detail/WorkflowsTab';
import { UtilitiesTab } from '../components/detail/UtilitiesTab';
import { DeploymentsTab } from '../components/detail/DeploymentsTab';
import { SettingsTab } from '../components/detail/SettingsTab';
import { RunConfigsTab } from '../components/detail/RunConfigsTab';
import { GitTab } from '../components/detail/GitTab';
import { TerminalTab } from '../components/detail/TerminalTab';
import { DependenciesTab } from '../components/detail/DependenciesTab';
import type { Project } from '../types';
import { PROJECTS } from '../../../routes/types/routeConstants';
import { setProjectContext } from '../utils/projectContext';

const TABS = [
  { id: 'overview', label: 'Overview', icon: FaEye },
  { id: 'tasks', label: 'Tasks', icon: FaTasks },
  { id: 'knowledge', label: 'Knowledge', icon: FaBook },
  { id: 'apis', label: 'APIs', icon: FaLink },
  { id: 'workflows', label: 'Workflows', icon: FaPlay },
  { id: 'git', label: 'Git', icon: FaGitAlt },
  { id: 'terminal', label: 'Terminal', icon: FaTerminal },
  { id: 'dependencies', label: 'Dependencies', icon: FaCube },
  { id: 'utilities', label: 'Utilities', icon: FaWrench },
  { id: 'deployments', label: 'Deployments', icon: FaCloudUploadAlt },
  { id: 'run-configs', label: 'Run', icon: FaTerminal },
  { id: 'settings', label: 'Settings', icon: FaCog },
] as const;

type TabId = typeof TABS[number]['id'];

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProject, toggleFavorite, updateLastOpened } = useProjects();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await getProject(Number(id));
      setProject(p);
      if (p) await updateLastOpened(p.id).catch(() => {});
    } catch {
      setProject(null);
    }
    setLoading(false);
  }, [id, getProject, updateLastOpened]);

  // Keep the last opened project available to the global terminal, Git, and tools pages.
  useEffect(() => { if (project) setProjectContext(project); }, [project]);

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
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-8 bg-theme-border/10 rounded-xl w-24 animate-pulse" />)}
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
      {/* Header */}
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

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-0.5 border-b border-theme-border/10">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'text-theme-icon border-theme-icon'
                  : 'text-theme-text/40 border-transparent hover:text-theme-text/70 hover:border-theme-text/20'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'overview' && <OverviewTab project={project} onRefresh={load} />}
        {activeTab === 'tasks' && <TasksTab projectId={project.id} />}
        {activeTab === 'knowledge' && <KnowledgeTab projectId={project.id} />}
        {activeTab === 'apis' && <ApisTab projectId={project.id} />}
        {activeTab === 'workflows' && <WorkflowsTab project={project} />}
        {activeTab === 'git' && <GitTab localPath={project.local_path} />}
        {activeTab === 'terminal' && <TerminalTab localPath={project.local_path} />}
        {activeTab === 'dependencies' && <DependenciesTab localPath={project.local_path} />}
        {activeTab === 'utilities' && <UtilitiesTab project={project} />}
        {activeTab === 'deployments' && <DeploymentsTab project={project} />}
        {activeTab === 'run-configs' && <RunConfigsTab projectId={project.id} localPath={project.local_path} />}
        {activeTab === 'settings' && <SettingsTab project={project} onRefresh={load} />}
      </div>
    </div>
  );
}
