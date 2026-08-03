import { useState, useEffect, useCallback } from 'react';
import { database } from '../../database';
import type { Workflow, WorkflowLog, StepLog } from './types';
import { actionExecutors } from './actionRegistry';
import { getProjectContext } from '../projects/utils/projectContext';

const SEED_KEY = 'devos_workflows_v7';

/** Day-to-day examples — all runnable on Windows DevOS. */
const SEED_WORKFLOWS = [
  { name: 'Morning coding setup', description: 'Pull, open editor + terminal, open localhost', category: 'development', steps: [
    { actionType: 'run-command', label: 'Git pull', config: { command: 'git pull' } },
    { actionType: 'open-vscode', label: 'Open editor', config: { path: '.' } },
    { actionType: 'open-terminal', label: 'Open terminal', config: { path: '.' } },
    { actionType: 'open-url', label: 'Open app', config: { url: 'http://localhost:5173' } },
    { actionType: 'notification', label: 'Ready', config: { notifTitle: 'Ready to code', notifType: 'success' } },
  ]},
  { name: 'Ship check', description: 'Status → install → build', category: 'development', steps: [
    { actionType: 'run-command', label: 'Git status', config: { command: 'git status' } },
    { actionType: 'run-command', label: 'npm install', config: { command: 'npm install' } },
    { actionType: 'run-command', label: 'npm run build', config: { command: 'npm run build' } },
    { actionType: 'notification', label: 'Done', config: { notifTitle: 'Build complete', notifType: 'success' } },
  ]},
  { name: 'Prepare commit', description: 'Stage all changes and show status', category: 'git', steps: [
    { actionType: 'run-command', label: 'git add -A', config: { command: 'git add -A' } },
    { actionType: 'run-command', label: 'git status', config: { command: 'git status' } },
    { actionType: 'notification', label: 'Staged', config: { notifTitle: 'Changes staged', notifType: 'info' } },
  ]},
  { name: 'Git pull', description: 'Pull latest from remote', category: 'git', steps: [
    { actionType: 'run-command', label: 'git pull', config: { command: 'git pull' } },
  ]},
  { name: 'Open workspace', description: 'Explorer + editor + terminal', category: 'project', steps: [
    { actionType: 'open-folder', label: 'Explorer', config: { path: '.' } },
    { actionType: 'open-vscode', label: 'Editor', config: { path: '.' } },
    { actionType: 'open-terminal', label: 'Terminal', config: { path: '.' } },
  ]},
  { name: 'Open Task Manager', description: 'Launch Windows Task Manager', category: 'system', steps: [
    { actionType: 'run-command', label: 'Task Manager', config: { command: 'taskmgr' } },
  ]},
  { name: 'Flush DNS', description: 'Clear Windows DNS cache', category: 'system', steps: [
    { actionType: 'run-command', label: 'ipconfig /flushdns', config: { command: 'ipconfig /flushdns' } },
    { actionType: 'notification', label: 'Done', config: { notifTitle: 'DNS flushed', notifType: 'success' } },
  ]},
  { name: 'Dev server URL', description: 'Open http://localhost:5173', category: 'development', steps: [
    { actionType: 'open-url', label: 'localhost:5173', config: { url: 'http://localhost:5173' } },
  ]},
];

/** Old example names from earlier seeds — remove leftover copies once. */
const LEGACY_EXAMPLE_NAMES = [
  'Morning coding setup', 'Ship check', 'Prepare commit', 'Git pull', 'Open workspace',
  'Open Task Manager', 'Flush DNS', 'Dev server URL', 'Flush DNS Cache', 'Open File Explorer',
  'Empty Recycle Bin', 'Git Status', 'Git Pull', 'Stage All Changes', 'Open GitHub Repo',
  'Open in Editor', 'Open Terminal', 'Open Dev Server', 'Install & Build', 'Sleep PC',
  'System quick tools',
];

function normalizeTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags.map(String);
  if (typeof tags === 'string') {
    try { return JSON.parse(tags); } catch { return []; }
  }
  return [];
}

function isBuiltIn(wf: { tags?: unknown }): boolean {
  return normalizeTags(wf.tags).includes('built-in');
}

/** Remove duplicate example workflows (keeps one per name). */
async function dedupeBuiltInWorkflows() {
  const existing = await database.getWorkflows();
  const seen = new Set<string>();
  for (const wf of existing) {
    if (!isBuiltIn(wf)) continue;
    const key = String(wf.name || '').trim().toLowerCase();
    if (!key) continue;
    if (seen.has(key)) {
      await database.deleteWorkflow(wf.id);
    } else {
      seen.add(key);
    }
  }
}

let seedLock: Promise<void> | null = null;

export function useWorkflows(projectId?: number | null) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    await dedupeBuiltInWorkflows();
    const data = projectId != null
      ? [...(await database.getWorkflowsByProject(projectId)), ...(await database.getGlobalWorkflows())]
      : await database.getWorkflows();
    setWorkflows(data);
    setLoading(false);
  }, [projectId]);

  const ensureSeeded = useCallback(async () => {
    if (seedLock) return seedLock;

    seedLock = (async () => {
      await dedupeBuiltInWorkflows();

      if (localStorage.getItem(SEED_KEY) === '1') {
        await load();
        return;
      }

      // Claim immediately so React StrictMode cannot double-insert
      localStorage.setItem(SEED_KEY, 'pending');

      localStorage.removeItem('devos_workflows_seeded');
      localStorage.removeItem('devos_workflows_v2');
      localStorage.removeItem('devos_workflows_v4');
      localStorage.removeItem('devos_workflows_v5');
      localStorage.removeItem('devos_workflows_v6');

      const existing = await database.getWorkflows();
      const wipeNames = new Set(
        [...SEED_WORKFLOWS.map(s => s.name), ...LEGACY_EXAMPLE_NAMES].map(n => n.toLowerCase()),
      );

      for (const wf of existing) {
        const name = String(wf.name || '').trim().toLowerCase();
        if (isBuiltIn(wf) || wipeNames.has(name)) {
          await database.deleteWorkflow(wf.id);
        }
      }

      for (const wf of SEED_WORKFLOWS) {
        await database.createWorkflow({
          name: wf.name,
          description: wf.description,
          steps: JSON.stringify(wf.steps.map((s: any, i: number) => ({
            id: `step_${i}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            ...s,
          }))),
          tags: JSON.stringify(['built-in']),
          category: wf.category,
        });
      }

      localStorage.setItem(SEED_KEY, '1');
      await load();
    })().catch((e) => {
      if (localStorage.getItem(SEED_KEY) === 'pending') localStorage.removeItem(SEED_KEY);
      throw e;
    }).finally(() => { seedLock = null; });

    return seedLock;
  }, [load]);

  useEffect(() => {
    ensureSeeded().catch((e) => {
      console.error('[Workflows] Seed failed:', e);
      setLoading(false);
    });
  }, [ensureSeeded]);

  const createWorkflow = useCallback(async (data: any) => {
    const created = await database.createWorkflow(data, projectId ?? null);
    if (created) setWorkflows(prev => [created, ...prev]);
    return created;
  }, [projectId]);

  const updateWorkflow = useCallback(async (id: number, data: any) => {
    await database.updateWorkflow(id, data);
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, ...data, updated_at: new Date().toISOString() } : w));
  }, []);

  const deleteWorkflow = useCallback(async (id: number) => {
    await database.deleteWorkflow(id);
    setWorkflows(prev => prev.filter(w => w.id !== id));
  }, []);

  const toggleFavorite = useCallback(async (id: number) => {
    await database.toggleWorkflowFavorite(id);
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, favorite: !w.favorite, updated_at: new Date().toISOString() } : w));
  }, []);

  const refresh = useCallback(async () => { await load(); }, [load]);

  return { workflows, loading, createWorkflow, updateWorkflow, deleteWorkflow, toggleFavorite, refresh };
}

export type RunOptions = { projectPath?: string };

export function useWorkflowRunner() {
  const [running, setRunning] = useState(false);
  const [currentLog, setCurrentLog] = useState<WorkflowLog | null>(null);

  function injectProjectContext(config: any, projectPath?: string) {
    const ctxPath = projectPath || getProjectContext()?.localPath || null;
    if (!ctxPath) return config;
    const c = { ...config };
    if (!c.path || c.path === '.' || c.path === '') c.path = ctxPath;
    if (!c.commandCwd || c.commandCwd === '' || c.commandCwd === '.') c.commandCwd = ctxPath;
    if (!c.sourcePath) c.sourcePath = ctxPath;
    return c;
  }

  const runWorkflow = useCallback(async (workflow: Workflow, options?: RunOptions): Promise<void> => {
    setRunning(true);
    const steps: StepLog[] = workflow.steps.map(s => ({
      stepId: s.id, actionType: s.actionType, label: s.label,
      status: 'pending' as const, startedAt: new Date().toISOString(),
      completedAt: null, output: '', error: null,
    }));

    const log = await database.createWorkflowLog(workflow.id, 'running', JSON.stringify(steps));
    if (!log) { setRunning(false); return; }
    setCurrentLog(log);
    await database.updateWorkflowLastRun(workflow.id, 'running');

    let allSuccess = true;
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const stepLog = steps[i];
      stepLog.status = 'running';
      stepLog.startedAt = new Date().toISOString();
      setCurrentLog(prev => prev ? { ...prev, step_logs: [...steps] } : null);

      try {
        const config = injectProjectContext(step.config, options?.projectPath);
        const executor = actionExecutors[step.actionType];
        if (!executor) throw new Error(`Unknown action: ${step.actionType}`);
        const result = await executor(config);
        stepLog.status = result.success ? 'success' : 'failed';
        stepLog.output = result.output;
        stepLog.error = result.error || null;
        if (!result.success) {
          allSuccess = false;
          if (!step.config?.continueOnError) {
            for (let j = i + 1; j < steps.length; j++) {
              steps[j].status = 'skipped';
              steps[j].completedAt = new Date().toISOString();
            }
            break;
          }
        }
      } catch (e: any) {
        stepLog.status = 'failed';
        stepLog.error = e.message;
        allSuccess = false;
        if (!step.config?.continueOnError) {
          for (let j = i + 1; j < steps.length; j++) {
            steps[j].status = 'skipped';
            steps[j].completedAt = new Date().toISOString();
          }
          break;
        }
      }
      stepLog.completedAt = new Date().toISOString();
      setCurrentLog(prev => prev ? { ...prev, step_logs: [...steps] } : null);
      await database.updateWorkflowLog(log.id, 'running', JSON.stringify([...steps]));
    }

    const finalStatus = allSuccess ? 'completed' : 'failed';
    await database.updateWorkflowLog(log.id, finalStatus, JSON.stringify(steps));
    await database.updateWorkflowLastRun(workflow.id, finalStatus);
    setCurrentLog(prev => prev ? { ...prev, status: finalStatus, step_logs: steps, completed_at: new Date().toISOString() } : null);
    setRunning(false);
  }, []);

  return { running, currentLog, runWorkflow, setCurrentLog };
}

export function useWorkflowLogs(workflowId: number | null) {
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (workflowId === null) { setLogs([]); return; }
    setLoading(true);
    database.getWorkflowLogs(workflowId).then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, [workflowId]);

  return { logs, loading };
}
