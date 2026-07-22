import React from 'react';
import { Navigate } from 'react-router-dom';
import { CATCH_ALL, DASHBOARD, SETTING, PROJECTS, KNOWLEDGE, TOOLBOX, AUTOMATION } from './types/routeConstants';
import { createRoute } from './types/createRoute';
import { AppLayout } from '../components/layout/AppLayout';

const DashboardPage = React.lazy(() =>
  import('../features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);

const SettingsPage = React.lazy(() =>
  import('../features/settings/pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

const ProjectsPage = React.lazy(() =>
  import('../features/projects/pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage }))
);

const KnowledgePage = React.lazy(() =>
  import('../features/knowledge/pages/KnowledgePage').then((m) => ({ default: m.KnowledgePage }))
);

const ToolboxPage = React.lazy(() =>
  import('../features/toolbox/pages/ToolboxPage').then((m) => ({ default: m.ToolboxPage }))
);

const AutomationPage = React.lazy(() =>
  import('../features/automation/pages/AutomationPage').then((m) => ({ default: m.AutomationPage }))
);

const ErrorPage = React.lazy(() => import('../pages/ErrorPage'));

const routes = [
  createRoute('/', () => <Navigate to={DASHBOARD} replace />),
  createRoute(DASHBOARD, DashboardPage, { layout: AppLayout }),
  createRoute(SETTING, SettingsPage, { layout: AppLayout }),
  createRoute(PROJECTS, ProjectsPage, { layout: AppLayout }),
  createRoute(KNOWLEDGE, KnowledgePage, { layout: AppLayout }),
  createRoute(TOOLBOX, ToolboxPage, { layout: AppLayout }),
  createRoute(AUTOMATION, AutomationPage, { layout: AppLayout }),
  createRoute(CATCH_ALL, ErrorPage),
];

export default routes;
