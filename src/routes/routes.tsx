import React from 'react';
import { Navigate } from 'react-router-dom';
import { useActiveProjectStore } from '../stores/activeProject.store';
import { CATCH_ALL, DASHBOARD, SETTING, PROFILE, PROJECTS, PROJECT_DETAIL, PROJECT_FORM, PROJECT_EDIT, KNOWLEDGE, UTILITIES, WORKFLOWS, AI, BACKUP, CLIPBOARD, SNIPPETS, TASKS, TERMINAL, GIT_CLIENT, ENV_MANAGER, DEPENDENCIES, TELEGRAM, INSIGHTS } from './types/routeConstants';
import { createRoute } from './types/createRoute';
import { AppLayout } from '../components/layout/AppLayout';

const DashboardPage = React.lazy(() =>
  import('../features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);

const SettingsPage = React.lazy(() =>
  import('../features/settings/pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

const ProfilePage = React.lazy(() =>
  import('../features/settings/pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);

const ProjectsPage = React.lazy(() =>
  import('../features/projects/pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage }))
);

const ProjectDetailPage = React.lazy(() =>
  import('../features/projects/pages/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage }))
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

const SnippetsPage = React.lazy(() =>
  import('../features/snippets/SnippetsPage').then((m) => ({ default: m.SnippetsPage }))
);

const TasksPage = React.lazy(() =>
  import('../features/tasks/pages/TasksPage').then((m) => ({ default: m.TasksPage }))
);

const TelegramPage = React.lazy(() =>
  import('../features/telegram/pages/TelegramPage').then((m) => ({ default: m.TelegramPage }))
);

const InsightsPage = React.lazy(() =>
  import('../features/insights/pages/InsightsPage').then((m) => ({ default: m.InsightsPage }))
);

const ErrorPage = React.lazy(() => import('../pages/ErrorPage'));

// Deprecated standalone tool routes — redirect to project detail with appropriate tab
function DeprecatedToolRedirect({ tab }: { tab: string }) {
  const ap = useActiveProjectStore((s) => s.activeProject);
  if (ap) {
    return <Navigate to={`/projects/${ap.id}?tab=${tab}`} replace />;
  }
  return <Navigate to={PROJECTS} replace />;
}

const routes = [
  createRoute('/', () => <Navigate to={DASHBOARD} replace />),
  createRoute(DASHBOARD, DashboardPage, { layout: AppLayout }),
  createRoute(SETTING, SettingsPage, { layout: AppLayout }),
  createRoute(PROFILE, ProfilePage, { layout: AppLayout }),
  createRoute(PROJECTS, ProjectsPage, { layout: AppLayout }),
  createRoute(PROJECT_DETAIL, ProjectDetailPage, { layout: AppLayout }),
  createRoute(PROJECT_FORM, ProjectFormPage, { layout: AppLayout }),
  createRoute(PROJECT_EDIT, ProjectFormPage, { layout: AppLayout }),
  createRoute(KNOWLEDGE, LibraryPage, { layout: AppLayout }),
  createRoute(UTILITIES, UtilitiesPage, { layout: AppLayout }),
  createRoute(WORKFLOWS, WorkflowsPage, { layout: AppLayout }),
  createRoute(AI, AiPage, { layout: AppLayout }),
  createRoute(BACKUP, BackupPage, { layout: AppLayout }),
  createRoute(CLIPBOARD, ClipboardPage, { layout: AppLayout }),
  createRoute(SNIPPETS, SnippetsPage, { layout: AppLayout }),
  createRoute(TASKS, TasksPage, { layout: AppLayout }),
  createRoute(TELEGRAM, TelegramPage, { layout: AppLayout }),
  createRoute(INSIGHTS, InsightsPage, { layout: AppLayout }),
  // Deprecated standalone tool routes - redirect to project context
  createRoute(TERMINAL, () => <DeprecatedToolRedirect tab="terminal" />),
  createRoute(GIT_CLIENT, () => <DeprecatedToolRedirect tab="git" />),
  createRoute(ENV_MANAGER, () => <DeprecatedToolRedirect tab="env" />),
  createRoute(DEPENDENCIES, () => <DeprecatedToolRedirect tab="dependencies" />),
  createRoute(CATCH_ALL, ErrorPage),
];

export default routes;
