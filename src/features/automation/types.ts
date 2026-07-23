export type ActionType = 'open-application' | 'open-url' | 'run-command' | 'wait' | 'notification' | 'condition';

export interface StepConfig {
  appPath?: string;
  appArgs?: string;
  url?: string;
  command?: string;
  commandCwd?: string;
  waitForCompletion?: boolean;
  waitDuration?: number;
  waitUnit?: 'seconds' | 'minutes';
  notifTitle?: string;
  notifMessage?: string;
  notifType?: 'info' | 'success' | 'warning' | 'error';
  conditionVariable?: string;
  conditionOperator?: 'equals' | 'not-equals' | 'contains' | 'is-empty' | 'is-not-empty';
  conditionValue?: string;
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

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  'open-application': 'Open Application',
  'open-url': 'Open URL',
  'run-command': 'Run Command',
  'wait': 'Wait',
  'notification': 'Notification',
  'condition': 'Condition',
};

export const ACTION_TYPE_ICONS: Record<ActionType, string> = {
  'open-application': 'FaCode',
  'open-url': 'FaGlobe',
  'run-command': 'FaTerminal',
  'wait': 'FaClock',
  'notification': 'FaBell',
  'condition': 'FaRandom',
};
