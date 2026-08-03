// ── Workspace (Mode A: no project selected) ─────────────────────────
export const HOME = "/";
export const DASHBOARD = "/dashboard"; // deprecated → redirects to HOME
export const PROJECTS = "/projects";
export const PROJECT_FORM = "/projects/new";
export const PROJECT_EDIT = "/projects/:id/edit";
export const LIBRARY = "/library";
export const KNOWLEDGE = "/knowledge"; // deprecated → redirects to LIBRARY
export const UTILITIES = "/utilities";
export const WORKFLOWS = "/workflows";
export const AI = "/ai";
export const BACKUP = "/backup";
export const SETTING = "/settings";
export const CLIPBOARD = "/clipboard";
export const SNIPPETS = "/snippets"; // deprecated → redirects to LIBRARY
export const CATCH_ALL = "*";
export const PROFILE = "/profile";
export const TASKS = "/tasks"; // deprecated → redirects to active project
export const TELEGRAM = "/telegram";
export const INSIGHTS = "/insights";

// ── Project Hub (Mode B: inside a project) ──────────────────────────
export const PROJECT_DETAIL = "/projects/:id";
export const PROJECT_DASHBOARD = "/projects/:id";
export const PROJECT_TASKS = "/projects/:id/tasks";
export const PROJECT_KNOWLEDGE = "/projects/:id/knowledge";
export const PROJECT_TERMINAL = "/projects/:id/terminal";
export const PROJECT_GIT = "/projects/:id/git";
export const PROJECT_DEPENDENCIES = "/projects/:id/dependencies";
export const PROJECT_ENVIRONMENT = "/projects/:id/environment";
export const PROJECT_RUN_CONFIGS = "/projects/:id/run-configs";
export const PROJECT_DEPLOYMENTS = "/projects/:id/deployments";
export const PROJECT_WORKFLOWS = "/projects/:id/workflows";
export const PROJECT_APIS = "/projects/:id/apis";
export const PROJECT_SETTINGS = "/projects/:id/settings";

// ── Deprecated standalone tool routes (kept for redirects) ──────────
export const TERMINAL = "/terminal";
export const GIT_CLIENT = "/git";
export const ENV_MANAGER = "/env";
export const DEPENDENCIES = "/dependencies";

// ── Project tab → URL segment mapping ────────────────────────────────
export const PROJECT_TAB_ROUTES: Record<string, string> = {
  overview: PROJECT_DASHBOARD,
  tasks: PROJECT_TASKS,
  knowledge: PROJECT_KNOWLEDGE,
  terminal: PROJECT_TERMINAL,
  git: PROJECT_GIT,
  dependencies: PROJECT_DEPENDENCIES,
  environment: PROJECT_ENVIRONMENT,
  'run-configs': PROJECT_RUN_CONFIGS,
  deployments: PROJECT_DEPLOYMENTS,
  workflows: PROJECT_WORKFLOWS,
  apis: PROJECT_APIS,
  settings: PROJECT_SETTINGS,
};
