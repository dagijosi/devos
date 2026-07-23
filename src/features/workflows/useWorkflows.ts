import { useState, useEffect, useCallback } from 'react';
import { database } from '../../database';
import type { Workflow, WorkflowLog, StepLog } from './types';
import { actionExecutors } from './actionRegistry';

const SEED_KEY = 'devos_workflows_v4';

const SEED_WORKFLOWS = [
  { name: 'Start Development', description: 'Open VS Code, run backend & frontend, open browser', category: 'development', steps: [
    { actionType: 'open-vscode', label: 'Open VS Code', config: { path: '.' } },
    { actionType: 'run-command', label: 'Run Backend', config: { command: 'npm run dev', commandCwd: './backend', waitForCompletion: false } },
    { actionType: 'run-command', label: 'Run Frontend', config: { command: 'npm run dev', commandCwd: '.', waitForCompletion: false } },
    { actionType: 'open-url', label: 'Open Browser', config: { url: 'http://localhost:5173' } },
    { actionType: 'notification', label: 'Ready', config: { notifTitle: 'Ready to Code', notifType: 'success' } },
  ]},
  { name: 'Stop Development', description: 'Gracefully stop all dev servers', category: 'development', steps: [
    { actionType: 'notification', label: 'Notify', config: { notifTitle: 'Shutting Down', notifType: 'warning' } },
    { actionType: 'wait', label: 'Wait 3s', config: { waitDuration: 3, waitUnit: 'seconds' } },
    { actionType: 'notification', label: 'Done', config: { notifTitle: 'Shutdown Complete', notifType: 'info' } },
  ]},
  { name: 'Build Project', description: 'Install deps, build, open output folder', category: 'development', steps: [
    { actionType: 'run-command', label: 'npm install', config: { command: 'npm install' } },
    { actionType: 'run-command', label: 'npm run build', config: { command: 'npm run build' } },
    { actionType: 'open-folder', label: 'Open Build Folder', config: { path: './dist' } },
    { actionType: 'notification', label: 'Done', config: { notifTitle: 'Build Complete', notifType: 'success' } },
  ]},
  { name: 'Run Tests', description: 'Run the test suite', category: 'development', steps: [
    { actionType: 'run-command', label: 'Run Tests', config: { command: 'npm test' } },
    { actionType: 'notification', label: 'Done', config: { notifTitle: 'Tests Complete', notifType: 'success' } },
  ]},
  { name: 'Open Workspace', description: 'Open project workspace in VS Code', category: 'development', steps: [
    { actionType: 'open-vscode', label: 'Open VS Code', config: { path: '.' } },
    { actionType: 'open-terminal', label: 'Open Terminal', config: { path: '.' } },
  ]},
  { name: 'Restart Backend', description: 'Restart the backend dev server', category: 'development', steps: [
    { actionType: 'notification', label: 'Stopping', config: { notifTitle: 'Restarting Backend', notifType: 'warning' } },
    { actionType: 'run-command', label: 'Restart', config: { command: 'npm run dev', commandCwd: './backend', waitForCompletion: false } },
    { actionType: 'notification', label: 'Done', config: { notifTitle: 'Backend Restarted', notifType: 'success' } },
  ]},
  { name: 'Pull Latest', description: 'Pull latest changes from git', category: 'git', steps: [
    { actionType: 'run-command', label: 'Git Pull', config: { command: 'git pull' } },
    { actionType: 'notification', label: 'Done', config: { notifTitle: 'Pull Complete', notifType: 'info' } },
  ]},
  { name: 'Push Changes', description: 'Stage and push pending changes', category: 'git', steps: [
    { actionType: 'run-command', label: 'Git Add', config: { command: 'git add -A' } },
    { actionType: 'run-command', label: 'Git Commit', config: { command: 'git commit -m "update"' } },
    { actionType: 'run-command', label: 'Git Push', config: { command: 'git push' } },
    { actionType: 'notification', label: 'Done', config: { notifTitle: 'Push Complete', notifType: 'success' } },
  ]},
  { name: 'Commit', description: 'Quick commit all changes', category: 'git', steps: [
    { actionType: 'run-command', label: 'Git Add', config: { command: 'git add -A' } },
    { actionType: 'run-command', label: 'Git Status', config: { command: 'git status' } },
    { actionType: 'notification', label: 'Ready', config: { notifTitle: 'Ready to Commit', notifType: 'info' } },
  ]},
  { name: 'Create Branch', description: 'Create and switch to a new git branch', category: 'git', steps: [
    { actionType: 'notification', label: 'Create Branch', config: { notifTitle: 'Create New Branch', notifType: 'info' } },
  ]},
  { name: 'Merge Branch', description: 'Merge a branch into current', category: 'git', steps: [
    { actionType: 'notification', label: 'Merge', config: { notifTitle: 'Merge Branch', notifType: 'info' } },
  ]},
  { name: 'Open GitHub', description: 'Open repository on GitHub', category: 'git', steps: [
    { actionType: 'run-command', label: 'Get Remote URL', config: { command: 'git remote get-url origin' } },
    { actionType: 'open-url', label: 'Open GitHub', config: { url: 'https://github.com' } },
  ]},
  { name: 'Open Project', description: 'Open project folder and tools', category: 'project', steps: [
    { actionType: 'open-folder', label: 'Open Project', config: { path: '.' } },
    { actionType: 'open-vscode', label: 'Open VS Code', config: { path: '.' } },
    { actionType: 'notification', label: 'Ready', config: { notifTitle: 'Project Opened', notifType: 'success' } },
  ]},
  { name: 'Open Documentation', description: 'Open project documentation', category: 'project', steps: [
    { actionType: 'open-url', label: 'Open Docs', config: { url: 'http://localhost:3000/docs' } },
  ]},
  { name: 'Open API', description: 'Open API documentation', category: 'project', steps: [
    { actionType: 'open-url', label: 'Open API Docs', config: { url: 'http://localhost:3000/api' } },
  ]},
  { name: 'Backup Project', description: 'Create a project backup archive', category: 'project', steps: [
    { actionType: 'notification', label: 'Backup', config: { notifTitle: 'Backup Started', notifType: 'info' } },
    { actionType: 'run-command', label: 'Compress', config: { command: 'tar -czf backup.tar.gz ./src' } },
    { actionType: 'notification', label: 'Done', config: { notifTitle: 'Backup Complete', notifType: 'success' } },
  ]},
  { name: 'Archive Project', description: 'Archive project to zip file', category: 'project', steps: [
    { actionType: 'compress-zip', label: 'Compress Project', config: { sourcePath: '.', archivePath: '../project-archive.zip' } },
    { actionType: 'notification', label: 'Done', config: { notifTitle: 'Archive Complete', notifType: 'info' } },
  ]},
  { name: 'Move Files', description: 'Move files from source to destination', category: 'files', steps: [
    { actionType: 'move-file', label: 'Move Files', config: { sourcePath: '', destPath: '' } },
  ]},
  { name: 'Copy Folder', description: 'Copy folder to destination', category: 'files', steps: [
    { actionType: 'copy-file', label: 'Copy Folder', config: { sourcePath: '', destPath: '' } },
  ]},
  { name: 'Delete Temp Files', description: 'Delete temporary build artifacts', category: 'files', steps: [
    { actionType: 'run-command', label: 'Clean Cache', config: { command: 'rm -rf node_modules/.cache dist' } },
    { actionType: 'notification', label: 'Done', config: { notifTitle: 'Cleanup Complete', notifType: 'info' } },
  ]},
  { name: 'Compress Folder', description: 'Compress a folder into a ZIP archive', category: 'files', steps: [
    { actionType: 'compress-zip', label: 'Compress', config: { sourcePath: '', archivePath: '' } },
  ]},
  { name: 'Extract ZIP', description: 'Extract a ZIP archive', category: 'files', steps: [
    { actionType: 'extract-zip', label: 'Extract', config: { archivePath: '', extractDest: '.' } },
  ]},
  { name: 'Shutdown PC', description: 'Shut down the computer', category: 'system', steps: [
    { actionType: 'notification', label: 'Shutdown', config: { notifTitle: 'Shutting Down PC', notifType: 'warning' } },
    { actionType: 'run-command', label: 'Shutdown', config: { command: 'shutdown /s /t 10' } },
  ]},
  { name: 'Restart', description: 'Restart the computer', category: 'system', steps: [
    { actionType: 'notification', label: 'Restart', config: { notifTitle: 'Restarting PC', notifType: 'warning' } },
    { actionType: 'run-command', label: 'Restart', config: { command: 'shutdown /r /t 10' } },
  ]},
  { name: 'Sleep', description: 'Put the computer to sleep', category: 'system', steps: [
    { actionType: 'run-command', label: 'Sleep', config: { command: 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0' } },
  ]},
  { name: 'Clear Cache', description: 'Clear system and app cache', category: 'system', steps: [
    { actionType: 'run-command', label: 'Clear DNS Cache', config: { command: 'ipconfig /flushdns' } },
    { actionType: 'notification', label: 'Done', config: { notifTitle: 'Cache Cleared', notifType: 'info' } },
  ]},
  { name: 'Empty Trash', description: 'Empty the recycle bin', category: 'system', steps: [
    { actionType: 'run-command', label: 'Empty Recycle Bin', config: { command: 'powershell -Command "Clear-RecycleBin -Force"' } },
  ]},
  { name: 'Open Task Manager', description: 'Open Windows Task Manager', category: 'system', steps: [
    { actionType: 'run-command', label: 'Open Task Manager', config: { command: 'taskmgr' } },
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
    const existing = await database.getWorkflows();
    for (const wf of existing) { await database.deleteWorkflow(wf.id); }
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
