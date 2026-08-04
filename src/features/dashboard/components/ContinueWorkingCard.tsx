import { useNavigate } from 'react-router-dom';
import { FaArrowRight, FaFolder, FaCode, FaTerminal, FaGitAlt, FaExternalLinkAlt } from 'react-icons/fa';
import { useActiveProjectStore } from '../../../stores/activeProject.store';
import { useProjects } from '../../projects/hooks/useProjects';
import { useTasks } from '../../tasks/useTasks';
import { PROJECT_DETAIL, TERMINAL } from '../../../routes/types/routeConstants';
import { setProjectContext } from '../../projects/utils/projectContext';
import { openVSCode } from '../../projects/utils/projectActions';

export function ContinueWorkingCard() {
  const navigate = useNavigate();
  const { activeProject, recentProjects } = useActiveProjectStore();
  const { projects = [] } = useProjects();
  const { tasks: pendingTasks } = useTasks('today');

  const lastProject = activeProject || (recentProjects.length > 0 ? recentProjects[0] : null);
  const fullProject = lastProject ? projects.find((p: any) => p.id === lastProject.id) : null;

  if (!lastProject) {
    const latest = projects[0];
    if (!latest) return null;
    return (
      <div className="bg-theme-surface border border-theme-border/20 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <FaFolder className="w-4 h-4 text-theme-icon/60" />
          <span className="text-xs font-medium text-theme-text/50 uppercase tracking-wider">Start Working</span>
        </div>
        <p className="text-sm text-theme-text/40">Open a project to continue where you left off</p>
        <button
          onClick={() => navigate(PROJECT_DETAIL.replace(':id', String(latest.id)))}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-theme-icon/10 text-theme-icon border border-theme-icon/20 rounded-lg hover:bg-theme-icon/20 transition-colors"
        >
          <FaArrowRight className="w-3 h-3" />
          Open {latest.name}
        </button>
      </div>
    );
  }

  const projectTasks = pendingTasks.filter((t) => t.project_id === lastProject.id);
  const taskCount = projectTasks.length;

  const handleOpenProject = () => {
    if (fullProject) setProjectContext(fullProject);
    navigate(PROJECT_DETAIL.replace(':id', String(lastProject.id)));
  };

  const handleOpenTerminal = () => {
    navigate(`${TERMINAL}?cwd=${encodeURIComponent(lastProject.localPath)}&label=${encodeURIComponent(lastProject.name)}`);
  };

  const handleOpenVsCode = () => {
    if (lastProject.localPath) {
      openVSCode(lastProject.localPath).catch(() => {
        window.open(`vscode://file/${encodeURIComponent(lastProject.localPath)}`);
      });
    }
  };

  return (
    <div className="bg-theme-surface border border-theme-border/20 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-theme-icon/10">
            <FaFolder className="w-4 h-4 text-theme-icon" />
          </div>
          <div>
            <p className="text-sm font-medium text-theme-text">Continue Working</p>
            <p className="text-[10px] text-theme-text/40">{lastProject.name}</p>
          </div>
        </div>
        <button
          onClick={handleOpenProject}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-theme-icon text-white rounded-lg hover:bg-theme-icon/90 transition-colors"
        >
          Open <FaArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 text-theme-text/50">
          <FaGitAlt className="w-3 h-3" />
          <span>{lastProject.branch || 'main'}</span>
        </div>
        {taskCount > 0 && (
          <div className="flex items-center gap-1.5 text-yellow-400">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <span>{taskCount} pending task{taskCount !== 1 ? 's' : ''}</span>
          </div>
        )}
        {lastProject.localPath && (
          <span className="text-theme-text/30 truncate font-mono text-[10px]">{lastProject.localPath}</span>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button onClick={handleOpenTerminal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-theme-text/60 bg-theme-background/30 border border-theme-border/10 rounded-lg hover:text-theme-text hover:border-theme-border/30 transition-colors">
          <FaTerminal className="w-3 h-3" /> Terminal
        </button>
        <button onClick={handleOpenVsCode}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-theme-text/60 bg-theme-background/30 border border-theme-border/10 rounded-lg hover:text-theme-text hover:border-theme-border/30 transition-colors">
          <FaCode className="w-3 h-3" /> VS Code
        </button>
        {fullProject?.repository_url && (
          <a href={fullProject.repository_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-theme-text/60 bg-theme-background/30 border border-theme-border/10 rounded-lg hover:text-theme-text hover:border-theme-border/30 transition-colors">
            <FaExternalLinkAlt className="w-3 h-3" /> Repo
          </a>
        )}
      </div>
    </div>
  );
}
