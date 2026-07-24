import {
  FaCode, FaGlobe, FaTerminal, FaBell, FaFolder, FaCopy, FaFile,
  FaCompress, FaLock, FaClock, FaTrash, FaPlay, FaExternalLinkAlt,
} from 'react-icons/fa';
import type { ActionType, StepConfig, WorkflowStep } from './types';
import { ACTION_TYPE_LABELS } from './types';

export type ActionGroup = 'launch' | 'shell' | 'files' | 'flow';

export const ACTION_GROUPS: { id: ActionGroup; label: string }[] = [
  { id: 'launch', label: 'Open / Launch' },
  { id: 'shell', label: 'Commands' },
  { id: 'files', label: 'Files' },
  { id: 'flow', label: 'Flow' },
];

export interface ActionMeta {
  type: ActionType;
  group: ActionGroup;
  icon: any;
  color: string;
  tip: string;
  defaults: StepConfig;
  /** Short preview of configured step */
  preview: (c: StepConfig) => string;
}

export const ACTION_META: Record<ActionType, ActionMeta> = {
  'open-folder': {
    type: 'open-folder', group: 'launch', icon: FaFolder, color: 'text-blue-400',
    tip: 'Open a folder in File Explorer',
    defaults: { path: '.' },
    preview: (c) => c.path || '.',
  },
  'open-file': {
    type: 'open-file', group: 'launch', icon: FaFile, color: 'text-blue-400',
    tip: 'Open a file with the default app',
    defaults: { filePath: '', path: '' },
    preview: (c) => c.filePath || c.path || 'file',
  },
  'open-url': {
    type: 'open-url', group: 'launch', icon: FaGlobe, color: 'text-sky-400',
    tip: 'Open a URL in your browser',
    defaults: { url: 'https://' },
    preview: (c) => c.url || 'https://…',
  },
  'open-vscode': {
    type: 'open-vscode', group: 'launch', icon: FaCode, color: 'text-violet-400',
    tip: 'Open a folder in your preferred editor (Settings → Workflows prefs)',
    defaults: { path: '.' },
    preview: (c) => c.path || '.',
  },
  'open-terminal': {
    type: 'open-terminal', group: 'launch', icon: FaTerminal, color: 'text-zinc-400',
    tip: 'Open a terminal at a path',
    defaults: { path: '.' },
    preview: (c) => c.path || '.',
  },
  'open-application': {
    type: 'open-application', group: 'launch', icon: FaExternalLinkAlt, color: 'text-cyan-400',
    tip: 'Launch an app by path or name',
    defaults: { appPath: '', appArgs: '' },
    preview: (c) => c.appPath || 'app',
  },
  'run-command': {
    type: 'run-command', group: 'shell', icon: FaPlay, color: 'text-emerald-400',
    tip: 'Run a shell command (git, npm, taskmgr, ipconfig…)',
    defaults: { command: '', commandCwd: '', waitForCompletion: true },
    preview: (c) => c.command || 'command',
  },
  'run-script': {
    type: 'run-script', group: 'shell', icon: FaTerminal, color: 'text-emerald-400',
    tip: 'Run a .bat / .ps1 / .sh script file',
    defaults: { scriptPath: '' },
    preview: (c) => c.scriptPath || 'script',
  },
  'copy-file': {
    type: 'copy-file', group: 'files', icon: FaCopy, color: 'text-orange-400',
    tip: 'Copy a file or folder',
    defaults: { sourcePath: '', destPath: '' },
    preview: (c) => (c.sourcePath && c.destPath) ? `${c.sourcePath} → ${c.destPath}` : 'copy',
  },
  'move-file': {
    type: 'move-file', group: 'files', icon: FaCopy, color: 'text-orange-400',
    tip: 'Move a file or folder',
    defaults: { sourcePath: '', destPath: '' },
    preview: (c) => (c.sourcePath && c.destPath) ? `${c.sourcePath} → ${c.destPath}` : 'move',
  },
  'delete-file': {
    type: 'delete-file', group: 'files', icon: FaTrash, color: 'text-red-400',
    tip: 'Delete a file (permanent)',
    defaults: { filePath: '' },
    preview: (c) => c.filePath || 'path',
  },
  'compress-zip': {
    type: 'compress-zip', group: 'files', icon: FaCompress, color: 'text-amber-400',
    tip: 'Zip a folder',
    defaults: { sourcePath: '', archivePath: '' },
    preview: (c) => c.archivePath || c.sourcePath || 'zip',
  },
  'extract-zip': {
    type: 'extract-zip', group: 'files', icon: FaLock, color: 'text-amber-400',
    tip: 'Extract a zip archive',
    defaults: { archivePath: '', extractDest: '.' },
    preview: (c) => c.archivePath || 'archive',
  },
  'wait': {
    type: 'wait', group: 'flow', icon: FaClock, color: 'text-yellow-400',
    tip: 'Pause before the next step',
    defaults: { waitDuration: 3, waitUnit: 'seconds' },
    preview: (c) => `${c.waitDuration || 3} ${c.waitUnit || 'seconds'}`,
  },
  'notification': {
    type: 'notification', group: 'flow', icon: FaBell, color: 'text-pink-400',
    tip: 'Show a toast notification in DevOS',
    defaults: { notifTitle: 'Done', notifMessage: '', notifType: 'success' },
    preview: (c) => c.notifTitle || 'notification',
  },
};

export function newStep(actionType: ActionType = 'run-command', label?: string): WorkflowStep {
  const meta = ACTION_META[actionType];
  return {
    id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    actionType,
    label: label || ACTION_TYPE_LABELS[actionType],
    config: { ...meta.defaults },
  };
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: Array<{ actionType: ActionType; label: string; config: StepConfig }>;
}

/** Starter templates for the builder — practical daily-dev flows. */
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'blank',
    name: 'Blank workflow',
    description: 'Start empty and add your own steps',
    category: 'custom',
    steps: [],
  },
  {
    id: 'morning',
    name: 'Morning coding setup',
    description: 'Pull latest, open editor + terminal, open localhost',
    category: 'development',
    steps: [
      { actionType: 'run-command', label: 'Git pull', config: { command: 'git pull' } },
      { actionType: 'open-vscode', label: 'Open editor', config: { path: '.' } },
      { actionType: 'open-terminal', label: 'Open terminal', config: { path: '.' } },
      { actionType: 'open-url', label: 'Open app', config: { url: 'http://localhost:5173' } },
      { actionType: 'notification', label: 'Ready', config: { notifTitle: 'Ready to code', notifType: 'success' } },
    ],
  },
  {
    id: 'ship',
    name: 'Ship check',
    description: 'Status → install → build → notify',
    category: 'development',
    steps: [
      { actionType: 'run-command', label: 'Git status', config: { command: 'git status' } },
      { actionType: 'run-command', label: 'npm install', config: { command: 'npm install' } },
      { actionType: 'run-command', label: 'npm run build', config: { command: 'npm run build' } },
      { actionType: 'notification', label: 'Build done', config: { notifTitle: 'Build complete', notifType: 'success' } },
    ],
  },
  {
    id: 'commit-prep',
    name: 'Prepare commit',
    description: 'Stage everything and show status',
    category: 'git',
    steps: [
      { actionType: 'run-command', label: 'git add -A', config: { command: 'git add -A' } },
      { actionType: 'run-command', label: 'git status', config: { command: 'git status' } },
      { actionType: 'notification', label: 'Staged', config: { notifTitle: 'Changes staged — review then commit', notifType: 'info' } },
    ],
  },
  {
    id: 'quick-tools',
    name: 'System quick tools',
    description: 'Task Manager + flush DNS',
    category: 'system',
    steps: [
      { actionType: 'run-command', label: 'Task Manager', config: { command: 'taskmgr' } },
      { actionType: 'run-command', label: 'Flush DNS', config: { command: 'ipconfig /flushdns' } },
    ],
  },
  {
    id: 'open-workspace',
    name: 'Open my project',
    description: 'Explorer + editor + terminal — pick a project to fill paths',
    category: 'project',
    steps: [
      { actionType: 'open-folder', label: 'Explorer', config: { path: '.' } },
      { actionType: 'open-vscode', label: 'Editor', config: { path: '.' } },
      { actionType: 'open-terminal', label: 'Terminal', config: { path: '.' } },
    ],
  },
  {
    id: 'pull-project',
    name: 'Pull in my project',
    description: 'git pull in a project folder you already have',
    category: 'git',
    steps: [
      { actionType: 'run-command', label: 'git pull', config: { command: 'git pull', commandCwd: '.' } },
      { actionType: 'notification', label: 'Done', config: { notifTitle: 'Pull finished', notifType: 'success' } },
    ],
  },
];

export function stepsFromTemplate(t: WorkflowTemplate): WorkflowStep[] {
  if (!t.steps.length) return [newStep('run-command', 'Run command')];
  return t.steps.map((s) => ({
    id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    actionType: s.actionType,
    label: s.label,
    config: { ...ACTION_META[s.actionType].defaults, ...s.config },
  }));
}

/** Fill `.` / empty path & cwd fields with an absolute project folder. */
export function applyProjectPathToSteps(steps: WorkflowStep[], projectPath: string): WorkflowStep[] {
  const path = projectPath.trim();
  if (!path) return steps;
  return steps.map((s) => {
    const c = { ...s.config };
    if (c.path === undefined || c.path === '' || c.path === '.') c.path = path;
    if (c.commandCwd === undefined || c.commandCwd === '' || c.commandCwd === '.') c.commandCwd = path;
    if (s.actionType === 'run-command' && (!c.commandCwd || c.commandCwd === '.')) c.commandCwd = path;
    return { ...s, config: c };
  });
}

/** Instant workflows bound to a project's local_path. */
export function projectQuickWorkflows(project: { name: string; local_path: string; repository_url?: string; scripts?: Record<string, string> }) {
  const path = project.local_path;
  const open = {
    name: `Open · ${project.name}`,
    description: `Explorer, editor, and terminal in ${path}`,
    category: 'project',
    steps: [
      { actionType: 'open-folder' as const, label: 'Explorer', config: { path } },
      { actionType: 'open-vscode' as const, label: 'Editor', config: { path } },
      { actionType: 'open-terminal' as const, label: 'Terminal', config: { path } },
    ],
  };
  const pull = {
    name: `Pull · ${project.name}`,
    description: `git pull in ${path}`,
    category: 'git',
    steps: [
      { actionType: 'run-command' as const, label: 'git pull', config: { command: 'git pull', commandCwd: path } },
    ],
  };
  const scripts = Object.entries(project.scripts || {}).slice(0, 3).map(([key, cmd]) => ({
    name: `${key} · ${project.name}`,
    description: cmd,
    category: 'development',
    steps: [
      { actionType: 'run-command' as const, label: key, config: { command: cmd, commandCwd: path } },
    ],
  }));
  const repo = project.repository_url
    ? [{
        name: `Repo · ${project.name}`,
        description: project.repository_url,
        category: 'git',
        steps: [
          { actionType: 'open-url' as const, label: 'Open repo', config: { url: project.repository_url } },
        ],
      }]
    : [];
  return [open, pull, ...scripts, ...repo];
}
