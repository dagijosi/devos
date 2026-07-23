export type ActionType =
  | 'open-folder'
  | 'open-file'
  | 'open-url'
  | 'open-vscode'
  | 'open-terminal'
  | 'open-application'
  | 'run-command'
  | 'run-script'
  | 'wait'
  | 'notification'
  | 'copy-file'
  | 'move-file'
  | 'delete-file'
  | 'compress-zip'
  | 'extract-zip';

export type TriggerType = 'manual' | 'schedule' | 'app-startup' | 'project-opened' | 'project-closed';

export interface StepConfig {
  path?: string;
  filePath?: string;
  sourcePath?: string;
  destPath?: string;
  url?: string;
  appPath?: string;
  appArgs?: string;
  command?: string;
  commandCwd?: string;
  scriptPath?: string;
  waitForCompletion?: boolean;
  waitDuration?: number;
  waitUnit?: 'seconds' | 'minutes';
  notifTitle?: string;
  notifMessage?: string;
  notifType?: 'info' | 'success' | 'warning' | 'error';
  archivePath?: string;
  extractDest?: string;
}

export interface ScheduleConfig {
  type: 'daily' | 'weekly' | 'monthly';
  time?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

export interface Trigger {
  type: TriggerType;
  schedule?: ScheduleConfig;
}

export interface WorkflowStep {
  id: string;
  actionType: ActionType;
  label: string;
  config: StepConfig;
}

export interface Workflow {
  id: number;
  name: string;
  description: string;
  steps: WorkflowStep[];
  tags: string[];
  favorite: boolean;
  category: string;
  trigger: Trigger | null;
  enabled: boolean;
  last_run_at: string | null;
  last_run_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface StepLog {
  stepId: string;
  actionType: ActionType;
  label: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  startedAt: string;
  completedAt: string | null;
  output: string;
  error: string | null;
}

export interface WorkflowLog {
  id: number;
  workflow_id: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  step_logs: StepLog[];
  started_at: string;
  completed_at: string | null;
}

export const CATEGORIES = ['development', 'git', 'files', 'system', 'project', 'custom'] as const;
export type WorkflowCategory = typeof CATEGORIES[number];

export const CATEGORY_LABELS: Record<string, string> = {
  development: 'Development',
  git: 'Git',
  files: 'Files',
  system: 'System',
  project: 'Project',
  custom: 'Custom',
  morning: 'Morning',
};

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  'open-folder': 'Open Folder',
  'open-file': 'Open File',
  'open-url': 'Open URL',
  'open-vscode': 'Open VS Code',
  'open-terminal': 'Open Terminal',
  'open-application': 'Open Application',
  'run-command': 'Run Command',
  'run-script': 'Run Script',
  'wait': 'Wait',
  'notification': 'Notification',
  'copy-file': 'Copy File',
  'move-file': 'Move File',
  'delete-file': 'Delete File',
  'compress-zip': 'Compress ZIP',
  'extract-zip': 'Extract ZIP',
};
