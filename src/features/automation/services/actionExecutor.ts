import { toast } from 'sonner';
import type { WorkflowStep, StepLog, ActionType } from '../types';

export type StepResult = { success: boolean; output: string; error?: string };

const TAURI_SHELL = '@tauri-apps/plugin-shell';
const TAURI_OPENER = '@tauri-apps/plugin-opener';

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

async function tryTauriShell(): Promise<any> {
  try {
    return await import(/* @vite-ignore */ TAURI_SHELL);
  } catch {
    return null;
  }
}

async function tryTauriOpener(): Promise<any> {
  try {
    return await import(/* @vite-ignore */ TAURI_OPENER);
  } catch {
    return null;
  }
}

async function executeOpenApp(config: any): Promise<StepResult> {
  const path = config.appPath || '';
  if (!path) return { success: false, output: 'No application path specified' };
  if (isTauri()) {
    const shell = await tryTauriShell();
    if (shell?.Command) {
      try {
        const isWin = navigator.userAgent.includes('Windows');
        const cmd = isWin ? 'cmd' : 'sh';
        const args = isWin ? ['/c', 'start', '', path] : ['-c', `open "${path}"`];
        const command = shell.Command.create(cmd, args);
        await command.execute();
        return { success: true, output: `Opening: ${path}` };
      } catch (e: any) {
        return { success: false, output: `Failed to open: ${path}`, error: e.message };
      }
    }
  }
  toast.info(`Open Application: ${path}`, { description: 'Tauri shell unavailable in browser mode' });
  return { success: true, output: `Launch requested: ${path} (browser mode)` };
}

async function executeOpenUrl(config: any): Promise<StepResult> {
  const url = config.url || '';
  if (!url) return { success: false, output: 'No URL specified' };
  if (isTauri()) {
    const opener = await tryTauriOpener();
    if (opener?.open) {
      try {
        await opener.open(url);
        return { success: true, output: `Opening: ${url}` };
      } catch { /* fall through */ }
    }
    const shell = await tryTauriShell();
    if (shell?.open) {
      try { await shell.open(url); return { success: true, output: `Opening: ${url}` }; } catch { /* fall through */ }
    }
  }
  window.open(url, '_blank');
  return { success: true, output: `Opened: ${url}` };
}

async function executeRunCommand(config: any): Promise<StepResult> {
  const cmd = config.command || '';
  if (!cmd) return { success: false, output: 'No command specified' };
  if (isTauri()) {
    const shell = await tryTauriShell();
    if (shell?.Command) {
      try {
        const isWin = navigator.userAgent.includes('Windows');
        const cwd = config.commandCwd || '';
        let command;
        if (cwd) {
          command = shell.Command.create(isWin ? 'cmd' : 'sh', isWin ? ['/c', `cd /d "${cwd}" && ${cmd}`] : ['-c', `cd "${cwd}" && ${cmd}`]);
        } else {
          command = shell.Command.create(isWin ? 'cmd' : 'sh', isWin ? ['/c', cmd] : ['-c', cmd]);
        }
        const result = await command.execute();
        return { success: result.code === 0, output: result.stdout || `Command executed: ${cmd}`, error: result.stderr || undefined };
      } catch (e: any) {
        return { success: false, output: `Command failed: ${cmd}`, error: e.message };
      }
    }
  }
  toast.info(`Run Command: ${cmd}`, { description: 'Tauri shell unavailable in browser mode' });
  return { success: true, output: `Command queued: ${cmd} (browser mode)` };
}

async function executeWait(config: any): Promise<StepResult> {
  const duration = config.waitDuration ?? 5;
  const unit = config.waitUnit || 'seconds';
  const ms = unit === 'minutes' ? duration * 60000 : duration * 1000;
  await new Promise(resolve => setTimeout(resolve, ms));
  return { success: true, output: `Waited ${duration} ${unit}` };
}

async function executeNotification(config: any): Promise<StepResult> {
  const title = config.notifTitle || 'Workflow Notification';
  const message = config.notifMessage || '';
  const type = config.notifType || 'info';
  const toastFn = toast[type as keyof typeof toast] || toast.info;
  (toastFn as any)(title, { description: message });
  return { success: true, output: `Notification sent: ${title}` };
}

async function executeCondition(config: any): Promise<StepResult> {
  const variable = config.conditionVariable || '';
  const op = config.conditionOperator || 'equals';
  const value = config.conditionValue || '';
  const contextValue = (window as any).__workflow_context?.[variable] ?? '';
  let passed = false;
  switch (op) {
    case 'equals': passed = String(contextValue) === String(value); break;
    case 'not-equals': passed = String(contextValue) !== String(value); break;
    case 'contains': passed = String(contextValue).includes(String(value)); break;
    case 'is-empty': passed = !contextValue; break;
    case 'is-not-empty': passed = !!contextValue; break;
  }
  return {
    success: true,
    output: `Condition: "${variable}" ${op} "${value}" → ${passed ? 'PASSED' : 'FAILED'}`,
  };
}

export const actionExecutors: Record<ActionType, (config: any) => Promise<StepResult>> = {
  'open-application': executeOpenApp,
  'open-url': executeOpenUrl,
  'run-command': executeRunCommand,
  'wait': executeWait,
  'notification': executeNotification,
  'condition': executeCondition,
};
