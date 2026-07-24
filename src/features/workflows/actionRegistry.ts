import { toast } from 'sonner';
import type { ActionType } from './types';

export type StepResult = { success: boolean; output: string; error?: string };

function isWindows(): boolean {
  return navigator.userAgent.includes('Windows');
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;
}

async function tryShell(): Promise<{ mod: any; error?: string }> {
  if (!isTauri()) return { mod: null, error: 'Not running in the DevOS desktop app' };
  try {
    const mod = await import('@tauri-apps/plugin-shell');
    return { mod };
  } catch (e: any) {
    return { mod: null, error: e?.message || 'Failed to load shell plugin' };
  }
}

async function tryOpener(): Promise<any> {
  if (!isTauri()) return null;
  try { return await import('@tauri-apps/plugin-opener'); } catch { return null; }
}

function shellUnavailable(err?: string): StepResult {
  return {
    success: false,
    output: err || 'Shell not available',
    error: 'Use the DevOS desktop app (not a browser) so system commands can run.',
  };
}

function normalizePath(path: string): string {
  let p = path.trim();
  if (isWindows()) p = p.replace(/\//g, '\\');
  while (p.endsWith('\\')) p = p.slice(0, -1);
  return p;
}

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem('devos_tool_prefs') || '{}'); }
  catch { return {}; }
}
function getEditorCommand(): string {
  const p = loadPrefs();
  if (p.editor?.type === 'custom') return p.editor.path || 'code';
  const map: Record<string, string> = { vscode: 'code', cursor: 'cursor', windsurf: 'windsurf', webstorm: 'webstorm' };
  return map[p.editor?.type] || 'code';
}
function getBrowserCommand(): string {
  const p = loadPrefs();
  if (p.browser?.type === 'custom') return p.browser.path || '';
  const map: Record<string, string> = { chrome: 'chrome', firefox: 'firefox', edge: 'msedge', brave: 'brave' };
  return map[p.browser?.type] || '';
}

const executors: Record<ActionType, (config: any) => Promise<StepResult>> = {
  'open-folder': async (c) => {
    const p = normalizePath(c.path || c.filePath || '.');
    const { mod: shell, error } = await tryShell();
    if (shell?.Command) {
      try {
        if (isWindows()) { await shell.Command.create('explorer', [p]).execute(); }
        else if (navigator.userAgent.includes('Mac')) { await shell.Command.create('open', [p]).execute(); }
        else { await shell.Command.create('xdg-open', [p]).execute(); }
      } catch (e: any) { return { success: false, output: `Failed to open folder`, error: e.message }; }
      return { success: true, output: `Opened folder: ${p}` };
    }
    return shellUnavailable(error);
  },

  'open-file': async (c) => {
    const p = normalizePath(c.filePath || c.path || '.');
    const { mod: shell, error } = await tryShell();
    if (shell?.Command) {
      try {
        if (isWindows()) { await shell.Command.create('explorer', [p]).execute(); }
        else if (navigator.userAgent.includes('Mac')) { await shell.Command.create('open', [p]).execute(); }
        else { await shell.Command.create('xdg-open', [p]).execute(); }
      } catch (e: any) { return { success: false, output: `Failed to open file`, error: e.message }; }
      return { success: true, output: `Opened file: ${p}` };
    }
    return shellUnavailable(error);
  },

  'open-url': async (c) => {
    const url = c.url || '';
    if (!url) return { success: false, output: 'No URL specified' };
    const browserCmd = getBrowserCommand();
    if (browserCmd) {
      const { mod: shell } = await tryShell();
      if (shell?.Command) {
        try {
          if (isWindows()) { await shell.Command.create('cmd', ['/c', 'start', browserCmd, url]).execute(); }
          else if (navigator.userAgent.includes('Mac')) { await shell.Command.create('open', ['-a', browserCmd, url]).execute(); }
          else { await shell.Command.create('xdg-open', [url]).execute(); }
          return { success: true, output: `Opened ${url} in ${browserCmd}` };
        } catch (e: any) { return { success: false, output: `Failed to open in ${browserCmd}`, error: e.message }; }
      }
    }
    const opener = await tryOpener();
    if (opener?.openUrl) { try { await opener.openUrl(url); return { success: true, output: `Opened: ${url}` }; } catch {} }
    const { mod: shell } = await tryShell();
    if (shell?.open) { try { await shell.open(url); return { success: true, output: `Opened: ${url}` }; } catch {} }
    window.open(url, '_blank');
    return { success: true, output: `Opened: ${url}` };
  },

  'open-vscode': async (c) => {
    const p = normalizePath(c.path || '.');
    const cmd = getEditorCommand();
    const { mod: shell, error } = await tryShell();
    if (shell?.Command) {
      try {
        if (isWindows()) { await shell.Command.create('cmd', ['/c', 'start', '/B', cmd, p]).execute(); }
        else { await shell.Command.create('sh', ['-c', `"${cmd}" "${p}"`]).execute(); }
      } catch (e: any) { return { success: false, output: `"${cmd}" not found in PATH`, error: e.message }; }
      return { success: true, output: `Opening ${cmd}: ${p}` };
    }
    return shellUnavailable(error);
  },

  'open-terminal': async (c) => {
    const p = normalizePath(c.path || '.');
    const { mod: shell, error } = await tryShell();
    if (shell?.Command) {
      try {
        if (isWindows()) { await shell.Command.create('cmd', ['/c', 'cd', '/d', p, '&&', 'start', 'cmd']).execute(); }
        else { await shell.Command.create('sh', ['-c', `cd "${p}" && $SHELL`]).execute(); }
      } catch (e: any) { return { success: false, output: 'Failed to open terminal', error: e.message }; }
      return { success: true, output: `Opening terminal: ${p}` };
    }
    return shellUnavailable(error);
  },

  'open-application': async (c) => {
    const appPath = c.appPath || '';
    if (!appPath) return { success: false, output: 'No application specified' };
    const opener = await tryOpener();
    if (opener?.openPath) {
      try { await opener.openPath(appPath, c.appArgs || ''); return { success: true, output: `Opened: ${appPath}` }; } catch {}
    }
    const { mod: shell, error } = await tryShell();
    if (shell?.Command) {
      try {
        if (isWindows()) { await shell.Command.create('cmd', ['/c', 'start', '', appPath, ...(c.appArgs ? [c.appArgs] : [])]).execute(); }
        else { await shell.Command.create('sh', ['-c', `open "${appPath}"`]).execute(); }
      } catch (e: any) { return { success: false, output: `Failed to open: ${appPath}`, error: e.message }; }
      return { success: true, output: `Opened: ${appPath}` };
    }
    return shellUnavailable(error || 'Opener not available');
  },

  'run-command': async (c) => {
    const cmd = (c.command || '').trim();
    if (!cmd) return { success: false, output: 'No command specified' };
    const { mod: shell, error } = await tryShell();
    if (shell?.Command) {
      try {
        let r: any;
        const p = c.commandCwd ? normalizePath(c.commandCwd) : '';
        // Prefer allowlisted app names when the command is a single token (e.g. taskmgr)
        const simple = /^[a-zA-Z0-9_.-]+$/.test(cmd) ? cmd : '';
        if (simple && isWindows() && !p && ['taskmgr', 'explorer', 'powershell', 'cmd', 'ipconfig'].includes(simple.toLowerCase())) {
          r = await shell.Command.create(simple.toLowerCase() === 'cmd' ? 'cmd' : simple.toLowerCase(), []).execute();
        } else if (p && isWindows()) {
          r = await shell.Command.create('cmd', ['/c', `cd /d "${p}" && ${cmd}`]).execute();
        } else if (p) {
          r = await shell.Command.create('sh', ['-c', `cd "${p}" && ${cmd}`]).execute();
        } else {
          r = await shell.Command.create(isWindows() ? 'cmd' : 'sh', [isWindows() ? '/c' : '-c', cmd]).execute();
        }
        const code = typeof r.code === 'number' ? r.code : 0;
        if (code !== 0 && !r.stdout) {
          return { success: false, output: r.stderr || `Command exited with code ${code}`, error: r.stderr };
        }
        return { success: true, output: r.stdout || 'Command executed', error: r.stderr || undefined };
      } catch (e: any) { return { success: false, output: `Command failed: ${cmd}`, error: e.message }; }
    }
    return shellUnavailable(error);
  },

  'run-script': async (c) => {
    const scriptPath = c.scriptPath || c.command || '';
    if (!scriptPath) return { success: false, output: 'No script specified' };
    const { mod: shell, error } = await tryShell();
    if (shell?.Command) {
      try {
        const args = isWindows() ? ['/c', scriptPath] : ['-c', `bash "${scriptPath}"`];
        const r = await shell.Command.create(isWindows() ? 'cmd' : 'sh', args).execute();
        return { success: true, output: r.stdout || 'Script executed', error: r.stderr || undefined };
      } catch (e: any) { return { success: false, output: `Script failed: ${scriptPath}`, error: e.message }; }
    }
    return shellUnavailable(error);
  },

  'wait': async (c) => {
    const duration = c.waitDuration ?? 5;
    const unit = c.waitUnit || 'seconds';
    await new Promise(resolve => setTimeout(resolve, unit === 'minutes' ? duration * 60000 : duration * 1000));
    return { success: true, output: `Waited ${duration} ${unit}` };
  },

  'notification': async (c) => {
    const title = c.notifTitle || 'Workflow';
    const message = c.notifMessage || '';
    const type = c.notifType || 'info';
    const fn = toast[type as keyof typeof toast] || toast.info;
    (fn as any)(title, { description: message });
    return { success: true, output: `Notification: ${title}` };
  },

  'copy-file': async (c) => {
    const src = normalizePath(c.sourcePath || c.filePath || '');
    const dest = normalizePath(c.destPath || '');
    if (!src) return { success: false, output: 'No source path' };
    const { mod: shell, error } = await tryShell();
    if (shell?.Command) {
      try {
        const args = isWindows() ? ['/c', `copy "${src}" "${dest}"`] : ['-c', `cp "${src}" "${dest}"`];
        const r = await shell.Command.create(isWindows() ? 'cmd' : 'sh', args).execute();
        return { success: true, output: `Copied: ${src} → ${dest}`, error: r.stderr || undefined };
      } catch (e: any) { return { success: false, output: 'Copy failed', error: e.message }; }
    }
    return shellUnavailable(error);
  },

  'move-file': async (c) => {
    const src = normalizePath(c.sourcePath || c.filePath || '');
    const dest = normalizePath(c.destPath || '');
    if (!src) return { success: false, output: 'No source path' };
    const { mod: shell, error } = await tryShell();
    if (shell?.Command) {
      try {
        const args = isWindows() ? ['/c', `move "${src}" "${dest}"`] : ['-c', `mv "${src}" "${dest}"`];
        const r = await shell.Command.create(isWindows() ? 'cmd' : 'sh', args).execute();
        return { success: true, output: `Moved: ${src} → ${dest}`, error: r.stderr || undefined };
      } catch (e: any) { return { success: false, output: 'Move failed', error: e.message }; }
    }
    return shellUnavailable(error);
  },

  'delete-file': async (c) => {
    const fp = normalizePath(c.filePath || c.path || '');
    if (!fp) return { success: false, output: 'No file path' };
    const { mod: shell, error } = await tryShell();
    if (shell?.Command) {
      try {
        const args = isWindows() ? ['/c', `del /f "${fp}"`] : ['-c', `rm -f "${fp}"`];
        const r = await shell.Command.create(isWindows() ? 'cmd' : 'sh', args).execute();
        return { success: true, output: `Deleted: ${fp}`, error: r.stderr || undefined };
      } catch (e: any) { return { success: false, output: 'Delete failed', error: e.message }; }
    }
    return shellUnavailable(error);
  },

  'compress-zip': async (c) => {
    const src = normalizePath(c.sourcePath || c.path || '.');
    const dest = normalizePath(c.archivePath || `${src}.zip`);
    const { mod: shell, error } = await tryShell();
    if (shell?.Command) {
      try {
        const args = isWindows()
          ? ['/c', `powershell -NoProfile -Command "Compress-Archive -Path '${src}\\*' -DestinationPath '${dest}' -Force"`]
          : ['-c', `tar -czf '${dest}' -C '${src}' .`];
        const r = await shell.Command.create(isWindows() ? 'cmd' : 'sh', args).execute();
        return { success: true, output: `Compressed: ${src} → ${dest}`, error: r.stderr || undefined };
      } catch (e: any) { return { success: false, output: 'Compression failed', error: e.message }; }
    }
    return shellUnavailable(error);
  },

  'extract-zip': async (c) => {
    const src = normalizePath(c.archivePath || c.filePath || c.path || '');
    const dest = normalizePath(c.extractDest || '.');
    if (!src) return { success: false, output: 'No archive path' };
    const { mod: shell, error } = await tryShell();
    if (shell?.Command) {
      try {
        const args = isWindows()
          ? ['/c', `powershell -NoProfile -Command "Expand-Archive -Path '${src}' -DestinationPath '${dest}' -Force"`]
          : ['-c', `tar -xzf '${src}' -C '${dest}'`];
        const r = await shell.Command.create(isWindows() ? 'cmd' : 'sh', args).execute();
        return { success: true, output: `Extracted: ${src} → ${dest}`, error: r.stderr || undefined };
      } catch (e: any) { return { success: false, output: 'Extraction failed', error: e.message }; }
    }
    return shellUnavailable(error);
  },
};

export const actionExecutors = executors;
