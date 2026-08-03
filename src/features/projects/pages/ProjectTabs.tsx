import { OverviewTab } from '../components/detail/OverviewTab';
import { TasksTab } from '../components/detail/TasksTab';
import { KnowledgeTab } from '../components/detail/KnowledgeTab';
import { TerminalTab } from '../components/detail/TerminalTab';
import { GitTab } from '../components/detail/GitTab';
import { DependenciesTab } from '../components/detail/DependenciesTab';
import { RunConfigsTab } from '../components/detail/RunConfigsTab';
import { DeploymentsTab } from '../components/detail/DeploymentsTab';
import { WorkflowsTab } from '../components/detail/WorkflowsTab';
import { ApisTab } from '../components/detail/ApisTab';
import { SettingsTab } from '../components/detail/SettingsTab';
import { EnvManagerPage } from '../../env-manager/EnvManagerPage';
import { useProjectOutlet } from './projectOutlet';

export function ProjectOverviewPage() {
  const { project, onRefresh } = useProjectOutlet();
  if (!project) return null;
  return <OverviewTab project={project} onRefresh={onRefresh} />;
}

export function ProjectTasksPage() {
  const { project } = useProjectOutlet();
  if (!project) return null;
  return <TasksTab projectId={project.id} />;
}

export function ProjectKnowledgePage() {
  const { project } = useProjectOutlet();
  if (!project) return null;
  return <KnowledgeTab projectId={project.id} />;
}

export function ProjectTerminalPage() {
  const { project } = useProjectOutlet();
  if (!project) return null;
  return <TerminalTab localPath={project.local_path} />;
}

export function ProjectGitPage() {
  const { project } = useProjectOutlet();
  if (!project) return null;
  return <GitTab localPath={project.local_path} />;
}

export function ProjectDependenciesPage() {
  const { project } = useProjectOutlet();
  if (!project) return null;
  return <DependenciesTab localPath={project.local_path} />;
}

export function ProjectEnvironmentPage() {
  return <EnvManagerPage />;
}

export function ProjectRunConfigsPage() {
  const { project } = useProjectOutlet();
  if (!project) return null;
  return <RunConfigsTab projectId={project.id} localPath={project.local_path} />;
}

export function ProjectDeploymentsPage() {
  const { project } = useProjectOutlet();
  if (!project) return null;
  return <DeploymentsTab project={project} />;
}

export function ProjectWorkflowsPage() {
  const { project } = useProjectOutlet();
  if (!project) return null;
  return <WorkflowsTab project={project} />;
}

export function ProjectApisPage() {
  const { project } = useProjectOutlet();
  if (!project) return null;
  return <ApisTab projectId={project.id} />;
}

export function ProjectSettingsPage() {
  const { project, onRefresh } = useProjectOutlet();
  if (!project) return null;
  return <SettingsTab project={project} onRefresh={onRefresh} />;
}
