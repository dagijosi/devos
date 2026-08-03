export const PROJECT_MODULES = [
  'tasks',
  'knowledge',
  'terminal',
  'git',
  'dependencies',
  'environment',
  'run-configs',
  'deployments',
  'workflows',
  'apis',
] as const;

export type ProjectModule = (typeof PROJECT_MODULES)[number];

export const PROJECT_MODULE_LABELS: Record<ProjectModule, string> = {
  tasks: 'Tasks',
  knowledge: 'Knowledge',
  terminal: 'Terminal',
  git: 'Git',
  dependencies: 'Dependencies',
  environment: 'Environment',
  'run-configs': 'Run',
  deployments: 'Deployments',
  workflows: 'Workflows',
  apis: 'APIs',
};

export const DEFAULT_ENABLED_MODULES = [...PROJECT_MODULES];
