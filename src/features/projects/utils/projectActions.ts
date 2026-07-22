export type ActionResult = { success: boolean; message: string };

function isWindows(): boolean {
  return navigator.userAgent.includes('Windows');
}

const TAURI_SHELL = '@tauri-apps/plugin-shell';
const TAURI_OPENER = '@tauri-apps/plugin-opener';

async function tryTauriShell(): Promise<any> {
  try {
    const mod = await import(/* @vite-ignore */ TAURI_SHELL);
    return mod;
  } catch {
    return null;
  }
}

async function tryTauriOpener(): Promise<any> {
  try {
    const mod = await import(/* @vite-ignore */ TAURI_OPENER);
    return mod;
  } catch {
    return null;
  }
}

export async function openFolder(path: string): Promise<ActionResult> {
  if (!path) return { success: false, message: 'No path configured' };
  const opener = await tryTauriOpener();
  if (opener?.open) {
    try {
      await opener.open(path);
      return { success: true, message: 'Opened in file manager' };
    } catch { /* fall through */ }
  }
  const shell = await tryTauriShell();
  if (shell?.Command) {
    try {
      if (isWindows()) {
        const command = shell.Command.create('cmd', ['/c', 'explorer', path]);
        await command.execute();
      } else if (navigator.userAgent.includes('Mac')) {
        const command = shell.Command.create('sh', ['-c', `open "${path}"`]);
        await command.execute();
      } else {
        const command = shell.Command.create('sh', ['-c', `xdg-open "${path}"`]);
        await command.execute();
      }
      return { success: true, message: 'Opened in file manager' };
    } catch { /* fall through */ }
  }
  window.open(`file://${path}`);
  return { success: true, message: 'Attempted to open folder' };
}

export async function openVSCode(path: string): Promise<ActionResult> {
  if (!path) return { success: false, message: 'No path configured' };
  const shell = await tryTauriShell();
  if (shell?.Command) {
    try {
      const cmd = isWindows() ? 'cmd' : 'sh';
      const args = isWindows() ? ['/c', 'code', path] : ['-c', `code "${path}"`];
      const command = shell.Command.create(cmd, args);
      await command.execute();
      return { success: true, message: 'Opening VS Code...' };
    } catch {
      return { success: false, message: 'VS Code not found in PATH' };
    }
  }
  return { success: false, message: 'Shell not available in this environment' };
}

export async function openTerminal(path: string): Promise<ActionResult> {
  if (!path) return { success: false, message: 'No path configured' };
  const shell = await tryTauriShell();
  if (shell?.Command) {
    try {
      if (isWindows()) {
        const command = shell.Command.create('cmd', ['/c', 'start', 'cmd', '/k', `cd /d "${path}"`]);
        await command.execute();
      } else {
        const command = shell.Command.create('sh', ['-c', `cd "${path}" && $SHELL`]);
        await command.execute();
      }
      return { success: true, message: 'Opening terminal...' };
    } catch { /* fall through */ }
  }
  return { success: false, message: 'Terminal not available in this environment' };
}

export async function runScript(command: string, path?: string): Promise<ActionResult> {
  if (!command) return { success: false, message: 'No command configured' };
  const shell = await tryTauriShell();
  if (shell?.Command) {
    try {
      let cmd;
      if (path) {
        if (isWindows()) {
          cmd = shell.Command.create('cmd', ['/c', `cd /d "${path}" && ${command}`]);
        } else {
          cmd = shell.Command.create('sh', ['-c', `cd "${path}" && ${command}`]);
        }
      } else {
        if (isWindows()) {
          cmd = shell.Command.create('cmd', ['/c', command]);
        } else {
          cmd = shell.Command.create('sh', ['-c', command]);
        }
      }
      await cmd.execute();
      return { success: true, message: `Running: ${command}` };
    } catch { /* fall through */ }
  }
  return { success: false, message: 'Shell not available' };
}

export async function openBrowser(url: string): Promise<ActionResult> {
  if (!url) return { success: false, message: 'No URL configured' };
  const opener = await tryTauriOpener();
  if (opener?.open) {
    try {
      await opener.open(url);
      return { success: true, message: 'Opening browser...' };
    } catch { /* fall through */ }
  }
  const shell = await tryTauriShell();
  if (shell?.open) {
    try {
      await shell.open(url);
      return { success: true, message: 'Opening browser...' };
    } catch { /* fall through */ }
  }
  window.open(url, '_blank');
  return { success: true, message: 'Attempted to open browser' };
}
