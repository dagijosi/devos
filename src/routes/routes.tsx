import React from 'react';
import { Navigate } from 'react-router-dom';
import { CATCH_ALL, DASHBOARD, SETTING, PROFILE, PROJECTS, PROJECT_DETAIL, PROJECT_FORM, PROJECT_EDIT, KNOWLEDGE, UTILITIES, WORKFLOWS, AI, INSIGHTS, BACKUP, API_TYPE_GENERATOR, TELEGRAM, CLIPBOARD, HOSTS_SWITCHER, TERMINAL, GIT_CLIENT, ENV_MANAGER, SNIPPETS, DEPENDENCIES } from './types/routeConstants';
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

const InsightsPage = React.lazy(() =>
  import('../features/insights/pages/InsightsPage').then((m) => ({ default: m.InsightsPage }))
);

const BackupPage = React.lazy(() =>
  import('../features/backup/pages/BackupPage').then((m) => ({ default: m.BackupPage }))
);

const ApiTypeGeneratorPage = React.lazy(() =>
  import('../features/api-type-generator/pages/ApiTypeGeneratorPage').then((m) => ({ default: m.ApiTypeGeneratorPage }))
);

const TelegramPage = React.lazy(() =>
  import('../features/telegram/pages/TelegramPage').then((m) => ({ default: m.TelegramPage }))
);

const ClipboardPage = React.lazy(() =>
  import('../features/clipboard/ClipboardPage').then((m) => ({ default: m.ClipboardPage }))
);

const HostsSwitcherPage = React.lazy(() =>
  import('../features/hosts-switcher/HostsSwitcherPage').then((m) => ({ default: m.HostsSwitcherPage }))
);

const TerminalPage = React.lazy(() =>
  import('../features/terminal/TerminalPage').then((m) => ({ default: m.TerminalPage }))
);

const GitClientPage = React.lazy(() =>
  import('../features/git-client/GitClientPage').then((m) => ({ default: m.GitClientPage }))
);

const EnvManagerPage = React.lazy(() =>
  import('../features/env-manager/EnvManagerPage').then((m) => ({ default: m.EnvManagerPage }))
);

const SnippetsPage = React.lazy(() =>
  import('../features/snippets/SnippetsPage').then((m) => ({ default: m.SnippetsPage }))
);

const DependenciesPage = React.lazy(() =>
  import('../features/dependencies/DependenciesPage').then((m) => ({ default: m.DependenciesPage }))
);

const ErrorPage = React.lazy(() => import('../pages/ErrorPage'));

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
  createRoute(INSIGHTS, InsightsPage, { layout: AppLayout }),
  createRoute(BACKUP, BackupPage, { layout: AppLayout }),
  createRoute(API_TYPE_GENERATOR, ApiTypeGeneratorPage, { layout: AppLayout }),
  createRoute(TELEGRAM, TelegramPage, { layout: AppLayout }),
  createRoute(CLIPBOARD, ClipboardPage, { layout: AppLayout }),
  createRoute(HOSTS_SWITCHER, HostsSwitcherPage, { layout: AppLayout }),
  createRoute(TERMINAL, TerminalPage, { layout: AppLayout }),
  createRoute(GIT_CLIENT, GitClientPage, { layout: AppLayout }),
  createRoute(ENV_MANAGER, EnvManagerPage, { layout: AppLayout }),
  createRoute(SNIPPETS, SnippetsPage, { layout: AppLayout }),
  createRoute(DEPENDENCIES, DependenciesPage, { layout: AppLayout }),
  createRoute(CATCH_ALL, ErrorPage),
];

export default routes;
