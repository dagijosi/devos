import React from 'react';
import { Navigate } from 'react-router-dom';
import { useActiveProjectStore } from '../stores/activeProject.store';
import { HOME, DASHBOARD, SETTING, PROFILE, PROJECTS, PROJECT_DETAIL, PROJECT_FORM, PROJECT_EDIT, LIBRARY, UTILITIES, WORKFLOWS, AI, BACKUP, CLIPBOARD, SNIPPETS, TASKS, TERMINAL, GIT_CLIENT, ENV_MANAGER, DEPENDENCIES, TELEGRAM, INSIGHTS, KNOWLEDGE, CATCH_ALL } from './types/routeConstants';
import { createRoute } from './types/createRoute';
import { AppLayout } from '../components/layout/AppLayout';

// ── Workspace pages ───────────────────────────────────────────────
const HomePage = React.lazy(() => import('../pages/HomePage').then((m) => ({ default: m.HomePage })));

const SettingsPage = React.lazy(() =>
  import('../features/settings/pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

const ProfilePage = React.lazy(() =>
  import('../features/settings/pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);

const ProjectsPage = React.lazy(() =>
  import('../features/projects/pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage }))
);

const ProjectFormPage = React.lazy(() =>
  import('../features/projects/pages/ProjectFormPage').then((m) => ({ default: m.ProjectFormPage }))
);

const LibraryPage = React.lazy(() =>
  import('../features/knowledge/pages/LibraryPage').then((m) => ({ default: m.LibraryPage }))
);

const UtilitiesPage = React.lazy(() =>
  import('../features/utilities/pages/UtilitiesPage').then((m) => ({ default: m.UtilitiesPage }))
);

const WorkflowsPage = React.lazy(() =>
  import('../features/workflows/pages/WorkflowsPage').then((m) => ({ default: m.WorkflowsPage }))
);

const AiPage = React.lazy(() =>
  import('../features/ai/pages/AiPage').then((m) => ({ default: m.AiPage }))
);

const BackupPage = React.lazy(() =>
  import('../features/backup/pages/BackupPage').then((m) => ({ default: m.BackupPage }))
);

const ClipboardPage = React.lazy(() =>
  import('../features/clipboard/ClipboardPage').then((m) => ({ default: m.ClipboardPage }))
);

const TelegramPage = React.lazy(() =>
  import('../features/telegram/pages/TelegramPage').then((m) => ({ default: m.TelegramPage }))
);

const InsightsPage = React.lazy(() =>
  import('../features/insights/pages/InsightsPage').then((m) => ({ default: m.InsightsPage }))
);

// ── Project hub ───────────────────────────────────────────────────
const ProjectLayout = React.lazy(() =>
  import('../features/projects/pages/ProjectLayout').then((m) => ({ default: m.ProjectLayout }))
);

const ProjectOverviewPage = React.lazy(() =>
  import('../features/projects/pages/ProjectTabs').then((m) => ({ default: m.ProjectOverviewPage }))
);

const ProjectTasksPage = React.lazy(() =>
  import('../features/projects/pages/ProjectTabs').then((m) => ({ default: m.ProjectTasksPage }))
);

const ProjectKnowledgePage = React.lazy(() =>
  import('../features/projects/pages/ProjectTabs').then((m) => ({ default: m.ProjectKnowledgePage }))
);

const ProjectTerminalPage = React.lazy(() =>
  import('../features/projects/pages/ProjectTabs').then((m) => ({ default: m.ProjectTerminalPage }))
);

const ProjectGitPage = React.lazy(() =>
  import('../features/projects/pages/ProjectTabs').then((m) => ({ default: m.ProjectGitPage }))
);

const ProjectDependenciesPage = React.lazy(() =>
  import('../features/projects/pages/ProjectTabs').then((m) => ({ default: m.ProjectDependenciesPage }))
);

const ProjectEnvironmentPage = React.lazy(() =>
  import('../features/projects/pages/ProjectTabs').then((m) => ({ default: m.ProjectEnvironmentPage }))
);

const ProjectRunConfigsPage = React.lazy(() =>
  import('../features/projects/pages/ProjectTabs').then((m) => ({ default: m.ProjectRunConfigsPage }))
);

const ProjectDeploymentsPage = React.lazy(() =>
  import('../features/projects/pages/ProjectTabs').then((m) => ({ default: m.ProjectDeploymentsPage }))
);

const ProjectWorkflowsPage = React.lazy(() =>
  import('../features/projects/pages/ProjectTabs').then((m) => ({ default: m.ProjectWorkflowsPage }))
);

const ProjectApisPage = React.lazy(() =>
  import('../features/projects/pages/ProjectTabs').then((m) => ({ default: m.ProjectApisPage }))
);

const ProjectSettingsPage = React.lazy(() =>
  import('../features/projects/pages/ProjectTabs').then((m) => ({ default: m.ProjectSettingsPage }))
);

const ErrorPage = React.lazy(() => import('../pages/ErrorPage'));

// ── Redirects: legacy flat routes → project context or home ─────────
function ProjectContextRedirect({ tab }: { tab: string }) {
  const ap = useActiveProjectStore((s) => s.activeProject);
  if (ap) {
    return <Navigate to={`/projects/${ap.id}/${tab}`} replace />;
  }
  return <Navigate to={HOME} replace />;
}

const routes = [
  createRoute(HOME, HomePage, { layout: AppLayout }),
  // Deprecated global dashboard — home is the new entry point
  createRoute(DASHBOARD, () => <Navigate to={HOME} replace />),
  createRoute(SETTING, SettingsPage, { layout: AppLayout }),
  createRoute(PROFILE, ProfilePage, { layout: AppLayout }),
  createRoute(PROJECTS, ProjectsPage, { layout: AppLayout }),
  createRoute(PROJECT_FORM, ProjectFormPage, { layout: AppLayout }),
  createRoute(PROJECT_EDIT, ProjectFormPage, { layout: AppLayout }),
  // Project Hub — nested routes, URL is the source of truth
  createRoute(PROJECT_DETAIL, ProjectLayout, {
    layout: AppLayout,
    children: [
      createRoute({ index: true, Component: ProjectOverviewPage }),
      createRoute('tasks', ProjectTasksPage),
      createRoute('knowledge', ProjectKnowledgePage),
      createRoute('terminal', ProjectTerminalPage),
      createRoute('git', ProjectGitPage),
      createRoute('dependencies', ProjectDependenciesPage),
      createRoute('environment', ProjectEnvironmentPage),
      createRoute('run-configs', ProjectRunConfigsPage),
      createRoute('deployments', ProjectDeploymentsPage),
      createRoute('workflows', ProjectWorkflowsPage),
      createRoute('apis', ProjectApisPage),
      createRoute('settings', ProjectSettingsPage),
    ],
  }),
  createRoute(LIBRARY, LibraryPage, { layout: AppLayout }),
  createRoute(UTILITIES, UtilitiesPage, { layout: AppLayout }),
  createRoute(WORKFLOWS, WorkflowsPage, { layout: AppLayout }),
  createRoute(AI, AiPage, { layout: AppLayout }),
  createRoute(BACKUP, BackupPage, { layout: AppLayout }),
  createRoute(CLIPBOARD, ClipboardPage, { layout: AppLayout }),
  createRoute(TELEGRAM, TelegramPage, { layout: AppLayout }),
  createRoute(INSIGHTS, InsightsPage, { layout: AppLayout }),
  // Deprecated global routes → redirect
  createRoute(KNOWLEDGE, () => <Navigate to={LIBRARY} replace />),
  createRoute(SNIPPETS, () => <Navigate to={LIBRARY} replace />),
  createRoute(TASKS, () => <ProjectContextRedirect tab="tasks" />),
  createRoute(TERMINAL, () => <ProjectContextRedirect tab="terminal" />),
  createRoute(GIT_CLIENT, () => <ProjectContextRedirect tab="git" />),
  createRoute(ENV_MANAGER, () => <ProjectContextRedirect tab="environment" />),
  createRoute(DEPENDENCIES, () => <ProjectContextRedirect tab="dependencies" />),
  createRoute(CATCH_ALL, ErrorPage),
];

export default routes;
