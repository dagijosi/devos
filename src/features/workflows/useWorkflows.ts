import { useState, useEffect, useCallback } from 'react';
import { database } from '../../database';
import type { Workflow, WorkflowLog, StepLog } from './types';
import { actionExecutors } from './actionRegistry';

const SEED_KEY = 'devos_workflows_v5';

/** Curated examples that work out of the box on Windows DevOS builds. */
const SEED_WORKFLOWS = [
  { name: 'Open Task Manager', description: 'Launch Windows Task Manager', category: 'system', steps: [
    { actionType: 'run-command', label: 'Open Task Manager', config: { command: 'taskmgr' } },
  ]},
  { name: 'Flush DNS Cache', description: 'Clear the Windows DNS resolver cache', category: 'system', steps: [
    { actionType: 'run-command', label: 'ipconfig /flushdns', config: { command: 'ipconfig /flushdns' } },
    { actionType: 'notification', label: 'Done', config: { notifTitle: 'DNS cache flushed', notifType: 'success' } },
  ]},
  { name: 'Open File Explorer', description: 'Open Explorer in the current folder', category: 'system', steps: [
    { actionType: 'open-folder', label: 'Open Explorer', config: { path: '.' } },
  ]},
  { name: 'Empty Recycle Bin', description: 'Empty the Windows Recycle Bin', category: 'system', steps: [
    { actionType: 'run-command', label: 'Clear Recycle Bin', config: { command: 'powershell -NoProfile -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"' } },
    { actionType: 'notification', label: 'Done', config: { notifTitle: 'Recycle Bin emptied', notifType: 'info' } },
  ]},
  { name: 'Git Status', description: 'Show working tree status', category: 'git', steps: [
    { actionType: 'run-command', label: 'git status', config: { command: 'git status' } },
  ]},
  { name: 'Git Pull', description: 'Pull latest changes from the remote', category: 'git', steps: [
    { actionType: 'run-command', label: 'git pull', config: { command: 'git pull' } },
    { actionType: 'notification', label: 'Done', config: { notifTitle: 'Pull finished', notifType: 'success' } },
  ]},
  { name: 'Stage All Changes', description: 'git add -A and show status', category: 'git', steps: [
    { actionType: 'run-command', label: 'git add -A', config: { command: 'git add -A' } },
    { actionType: 'run-command', label: 'git status', config: { command: 'git status' } },
    { actionType: 'notification', label: 'Ready', config: { notifTitle: 'Changes staged', notifType: 'info' } },
  ]},
  { name: 'Open GitHub Repo', description: 'Open github.com in your browser', category: 'git', steps: [
    { actionType: 'open-url', label: 'Open GitHub', config: { url: 'https://github.com' } },
  ]},
  { name: 'Open in Editor', description: 'Open the current folder in your preferred editor', category: 'development', steps: [
    { actionType: 'open-vscode', label: 'Open Editor', config: { path: '.' } },
  ]},
  { name: 'Open Terminal', description: 'Open a terminal in the current folder', category: 'development', steps: [
    { actionType: 'open-terminal', label: 'Open Terminal', config: { path: '.' } },
  ]},
  { name: 'Open Dev Server', description: 'Open the local Vite URL', category: 'development', steps: [
    { actionType: 'open-url', label: 'localhost:5173', config: { url: 'http://localhost:5173' } },
  ]},
  { name: 'Install & Build', description: 'npm install then npm run build', category: 'development', steps: [
    { actionType: 'run-command', label: 'npm install', config: { command: 'npm install' } },
    { actionType: 'run-command', label: 'npm run build', config: { command: 'npm run build' } },
    { actionType: 'notification', label: 'Done', config: { notifTitle: 'Build complete', notifType: 'success' } },
  ]},
  { name: 'Sleep PC', description: 'Put this PC to sleep', category: 'system', steps: [
    { actionType: 'notification', label: 'Sleeping', config: { notifTitle: 'Going to sleep…', notifType: 'warning' } },
    { actionType: 'wait', label: 'Wait 2s', config: { waitDuration: 2, waitUnit: 'seconds' } },
    { actionType: 'run-command', label: 'Sleep', config: { command: 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0' } },
  ]},
];

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await database.getWorkflows();
    setWorkflows(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const ensureSeeded = useCallback(async () => {
    if (localStorage.getItem(SEED_KEY)) return;
    localStorage.removeItem('devos_workflows_seeded');
    localStorage.removeItem('devos_workflows_v2');
    localStorage.removeItem('devos_workflows_v4');
    const existing = await database.getWorkflows();
    for (const wf of existing) {
      const tags = Array.isArray(wf.tags) ? wf.tags : [];
      if (tags.includes('built-in')) await database.deleteWorkflow(wf.id);
    }
    for (const wf of SEED_WORKFLOWS) {
      await database.createWorkflow({
        name: wf.name,
        description: wf.description,
        steps: JSON.stringify(wf.steps.map((s: any, i: number) => ({
          id: `step_${i}_${Date.now()}`,
          ...s,
        }))),
        tags: JSON.stringify(['built-in']),
        category: wf.category,
      });
    }
    localStorage.setItem(SEED_KEY, '1');
    await load();
  }, [load]);

  useEffect(() => {
    ensureSeeded().catch((e) => {
      console.error('[Workflows] Seed failed:', e);
    });
  }, [ensureSeeded]);

  const createWorkflow = useCallback(async (data: any) => {
    const created = await database.createWorkflow(data);
    if (created) setWorkflows(prev => [created, ...prev]);
    return created;
  }, []);

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

export function useWorkflowRunner() {
  const [running, setRunning] = useState(false);
  const [currentLog, setCurrentLog] = useState<WorkflowLog | null>(null);

  function injectProjectContext(config: any) {
    const ctx = typeof window !== 'undefined' ? (window as any).__workflow_context : null;
    if (!ctx?.project_folder) return config;
    const c = { ...config };
    if (!c.path || c.path === '.' || c.path === '') c.path = ctx.project_folder;
    if (!c.commandCwd || c.commandCwd === '') c.commandCwd = ctx.project_folder;
    if (!c.sourcePath) c.sourcePath = ctx.project_folder;
    return c;
  }

  const runWorkflow = useCallback(async (workflow: Workflow): Promise<void> => {
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
        const config = injectProjectContext(step.config);
        const executor = actionExecutors[step.actionType];
        if (!executor) throw new Error(`Unknown action: ${step.actionType}`);
        const result = await executor(config);
        stepLog.status = result.success ? 'success' : 'failed';
        stepLog.output = result.output;
        stepLog.error = result.error || null;
        if (!result.success) allSuccess = false;
      } catch (e: any) {
        stepLog.status = 'failed';
        stepLog.error = e.message;
        allSuccess = false;
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
