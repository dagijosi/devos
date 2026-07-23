import { useState, useEffect, useCallback } from 'react';
import { database } from '../../../database';
import type { Workflow, WorkflowLog, StepLog } from '../types';
import { actionExecutors } from '../services/actionExecutor';

const SEED_KEY = 'devos_workflows_seeded';

const SEED_WORKFLOWS = [
  {
    name: 'Morning Routine',
    description: 'Start your day by opening dev tools and running servers',
    category: 'morning',
    steps: [
      { actionType: 'open-application', label: 'Open VS Code', config: { appPath: 'code' } },
      { actionType: 'run-command', label: 'Run Backend', config: { command: 'npm run dev', commandCwd: './backend', waitForCompletion: false } },
      { actionType: 'run-command', label: 'Run Frontend', config: { command: 'npm run dev', commandCwd: '.', waitForCompletion: false } },
      { actionType: 'open-url', label: 'Open Browser', config: { url: 'http://localhost:5173' } },
      { actionType: 'open-url', label: 'Open Database', config: { url: 'http://localhost:3306' } },
      { actionType: 'open-url', label: 'Open Documentation', config: { url: 'http://localhost:3000/docs' } },
      { actionType: 'notification', label: 'Ready', config: { notifTitle: 'Morning Routine Complete', notifMessage: 'All services started', notifType: 'success' } },
    ],
  },
  {
    name: 'Start Work',
    description: 'Open project and start development environment',
    category: 'custom',
    steps: [
      { actionType: 'open-application', label: 'Open VS Code', config: { appPath: 'code', appArgs: '.' } },
      { actionType: 'run-command', label: 'Start Dev Server', config: { command: 'npm run dev', waitForCompletion: false } },
      { actionType: 'open-url', label: 'Open Browser', config: { url: 'http://localhost:5173' } },
      { actionType: 'notification', label: 'Ready', config: { notifTitle: 'Ready to Code', notifType: 'info' } },
    ],
  },
  {
    name: 'Deploy',
    description: 'Build and deploy the application',
    category: 'custom',
    steps: [
      { actionType: 'run-command', label: 'Run Tests', config: { command: 'npm test' } },
      { actionType: 'wait', label: 'Wait 5s', config: { waitDuration: 5, waitUnit: 'seconds' } },
      { actionType: 'run-command', label: 'Build', config: { command: 'npm run build' } },
      { actionType: 'run-command', label: 'Deploy', config: { command: 'npm run deploy' } },
      { actionType: 'notification', label: 'Done', config: { notifTitle: 'Deploy Complete', notifType: 'success' } },
    ],
  },
  {
    name: 'Backup',
    description: 'Create a backup of important project data',
    category: 'custom',
    steps: [
      { actionType: 'notification', label: 'Starting Backup', config: { notifTitle: 'Backup Started', notifType: 'info' } },
      { actionType: 'run-command', label: 'Create Backup Archive', config: { command: 'tar -czf backup.tar.gz ./src' } },
      { actionType: 'run-command', label: 'Copy to Backup Dir', config: { command: 'cp backup.tar.gz ./backups/' } },
      { actionType: 'notification', label: 'Backup Complete', config: { notifTitle: 'Backup Complete', notifType: 'success' } },
    ],
  },
  {
    name: 'Shutdown',
    description: 'Gracefully shut down development environment',
    category: 'custom',
    steps: [
      { actionType: 'notification', label: 'Notify Shutdown', config: { notifTitle: 'Starting Shutdown', notifType: 'warning' } },
      { actionType: 'wait', label: 'Wait 3s', config: { waitDuration: 3, waitUnit: 'seconds' } },
      { actionType: 'run-command', label: 'Stop Servers', config: { command: 'kill $(lsof -t -i:5173) 2>/dev/null' } },
      { actionType: 'notification', label: 'Shutdown Complete', config: { notifTitle: 'Shutdown Complete', notifType: 'info' } },
    ],
  },
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
    const existing = await database.getWorkflows();
    if (existing.length > 0) {
      localStorage.setItem(SEED_KEY, '1');
      return;
    }
    for (const wf of SEED_WORKFLOWS) {
      await database.createWorkflow({
        name: wf.name,
        description: wf.description,
        steps: JSON.stringify(wf.steps.map((s: any, i: number) => ({
          id: `step_${i}_${Date.now()}`,
          ...s,
        }))),
        tags: JSON.stringify([]),
        category: wf.category,
      });
    }
    localStorage.setItem(SEED_KEY, '1');
    await load();
  }, [load]);

  useEffect(() => { ensureSeeded(); }, [ensureSeeded]);

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

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  return { workflows, loading, createWorkflow, updateWorkflow, deleteWorkflow, toggleFavorite, refresh };
}

export function useWorkflowRunner() {
  const [running, setRunning] = useState(false);
  const [currentLog, setCurrentLog] = useState<WorkflowLog | null>(null);

  const runWorkflow = useCallback(async (workflow: Workflow): Promise<void> => {
    setRunning(true);
    const steps: StepLog[] = workflow.steps.map(s => ({
      stepId: s.id,
      actionType: s.actionType,
      label: s.label,
      status: 'pending' as const,
      startedAt: new Date().toISOString(),
      completedAt: null,
      output: '',
      error: null,
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
        const executor = actionExecutors[step.actionType];
        if (!executor) throw new Error(`Unknown action type: ${step.actionType}`);
        const result = await executor(step.config);
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

      const currentSteps = [...steps];
      await database.updateWorkflowLog(log.id, 'running', JSON.stringify(currentSteps));
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
