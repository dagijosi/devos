export type ActionResult = { success: boolean; message: string };

function isWindows(): boolean {
  return navigator.userAgent.includes('Windows');
}

async function tryTauriShell(): Promise<any> {
  try {
    // @ts-ignore - optional Tauri plugin
    const mod = await import('@tauri-apps/plugin-shell');
    return mod;
  } catch {
    return null;
  }
}

async function tryTauriOpener(): Promise<any> {
  try {
    // @ts-ignore - optional Tauri plugin
    const mod = await import('@tauri-apps/plugin-opener');
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
  if (shell?.open) {
    try {
      await shell.open(path);
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
      await shell.Command.create('code', [path]);
      return { success: true, message: 'Opening VS Code...' };
    } catch { /* fall through */ }
  }
  if (shell?.Command) {
    try {
      const cmd = isWindows() ? 'cmd' : 'sh';
      const args = isWindows() ? ['/c', 'code', path] : ['-c', `code "${path}"`];
      await shell.Command.create(cmd, args);
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
        await shell.Command.create('cmd', ['/c', 'start', 'cmd']);
      } else {
        await shell.Command.create('sh', ['-c', `cd "${path}" && $SHELL`]);
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
      if (path) {
        if (isWindows()) {
          await shell.Command.create('cmd', ['/c', `cd /d "${path}" && ${command}`]);
        } else {
          await shell.Command.create('sh', ['-c', `cd "${path}" && ${command}`]);
        }
      } else {
        if (isWindows()) {
          await shell.Command.create('cmd', ['/c', command]);
        } else {
          await shell.Command.create('sh', ['-c', command]);
        }
      }
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
