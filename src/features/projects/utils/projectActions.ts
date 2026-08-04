export type ActionResult = { success: boolean; message: string };

function isWindows(): boolean {
  return navigator.userAgent.includes('Windows');
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;
}

function normalizePath(path: string): string {
  let p = path.trim();
  if (isWindows()) p = p.replace(/\//g, '\\');
  while (p.endsWith('\\')) p = p.slice(0, -1);
  return p;
}

async function tryShellModule(): Promise<any> {
  if (!isTauri()) return null;
  try {
    return await import('@tauri-apps/plugin-shell');
  } catch {
    return null;
  }
}

async function tryOpenerModule(): Promise<any> {
  if (!isTauri()) return null;
  try {
    return await import('@tauri-apps/plugin-opener');
  } catch {
    return null;
  }
}

export async function openFolder(path: string): Promise<ActionResult> {
  if (!path) return { success: false, message: 'No path configured' };
  const normalized = normalizePath(path);
  if (!normalized) return { success: false, message: `Path is empty after normalization (was: "${path}")` };
  if (isWindows() && !normalized.includes(':')) return { success: false, message: `Path "${normalized}" doesn't look like a valid Windows path (missing drive letter)` };
  const shell = await tryShellModule();
  if (shell?.Command) {
    try {
      if (isWindows()) {
        await shell.Command.create('explorer', [normalized]).execute();
      } else if (navigator.userAgent.includes('Mac')) {
        await shell.Command.create('open', [normalized]).execute();
      } else {
        await shell.Command.create('xdg-open', [normalized]).execute();
      }
      return { success: true, message: 'Opened in file manager' };
    } catch { /* fall through */ }
  }
  return { success: false, message: 'Cannot open local files in this environment' };
}

export async function openVSCode(path: string): Promise<ActionResult> {
  if (!path) return { success: false, message: 'No path configured' };
  const normalized = normalizePath(path);
  if (!normalized) return { success: false, message: `Path is empty after normalization (was: "${path}")` };
  const opener = await tryOpenerModule();
  if (opener?.openPath) {
    try { await opener.openPath(normalized, 'code'); return { success: true, message: 'Opening VS Code...' }; } catch {}
  }
  const shell = await tryShellModule();
  if (shell?.Command) {
    try {
      if (isWindows()) {
        await shell.Command.create('cmd', ['/c', 'start', '/B', 'code', normalized]).execute();
      } else {
        await shell.Command.create('sh', ['-c', `code "${normalized}"`]).execute();
      }
      return { success: true, message: 'Opening VS Code...' };
    } catch { return { success: false, message: 'VS Code not found in PATH' }; }
  }
  return { success: false, message: 'Shell not available in this environment' };
}

export interface EditorTarget {
  program: string;
  isScript: boolean;
}

export async function openEditor(path: string, editor: EditorTarget): Promise<ActionResult> {
  if (!path) return { success: false, message: 'No path configured' };
  const normalized = normalizePath(path);
  if (!normalized) return { success: false, message: `Path is empty after normalization (was: "${path}")` };
  const shell = await tryShellModule();
  if (!shell?.Command) return { success: false, message: 'Shell not available in this environment' };
  try {
    if (isWindows() && editor.isScript) {
      await shell.Command.create('cmd', ['/c', 'start', '', editor.program, normalized]).execute();
    } else {
      await shell.Command.create(editor.program, [normalized]).execute();
    }
    return { success: true, message: 'Opening editor...' };
  } catch {
    return { success: false, message: 'Failed to launch editor' };
  }
}

export async function openTerminal(path: string): Promise<ActionResult> {
  if (!path) return { success: false, message: 'No path configured' };
  const normalized = normalizePath(path);
  if (!normalized) return { success: false, message: `Path is empty after normalization (was: "${path}")` };
  const shell = await tryShellModule();
  if (shell?.Command) {
    try {
      if (isWindows()) {
        await shell.Command.create('cmd', ['/c', 'cd', '/d', normalized, '&&', 'start', 'cmd']).execute();
      } else {
        await shell.Command.create('sh', ['-c', `cd "${normalized}" && $SHELL`]).execute();
      }
      return { success: true, message: 'Opening terminal...' };
    } catch { /* fall through */ }
  }
  return { success: false, message: 'Terminal not available in this environment' };
}

export async function runScript(command: string, path?: string): Promise<ActionResult> {
  if (!command) return { success: false, message: 'No command configured' };
  const shell = await tryShellModule();
  if (shell?.Command) {
    try {
      if (path) {
        const normalized = normalizePath(path);
        if (isWindows()) {
          await shell.Command.create('cmd', ['/c', `cd /d "${normalized}" && ${command}`]).execute();
        } else {
          await shell.Command.create('sh', ['-c', `cd "${normalized}" && ${command}`]).execute();
        }
      } else {
        if (isWindows()) {
          await shell.Command.create('cmd', ['/c', command]).execute();
        } else {
          await shell.Command.create('sh', ['-c', command]).execute();
        }
      }
      return { success: true, message: `Running: ${command}` };
    } catch { /* fall through */ }
  }
  return { success: false, message: 'Shell not available' };
}

export async function openBrowser(url: string): Promise<ActionResult> {
  if (!url) return { success: false, message: 'No URL configured' };
  const opener = await tryOpenerModule();
  if (opener?.openUrl) {
    try { await opener.openUrl(url); return { success: true, message: 'Opening browser...' }; } catch { /* fall through */ }
  }
  const shell = await tryShellModule();
  if (shell?.open) {
    try { await shell.open(url); return { success: true, message: 'Opening browser...' }; } catch { /* fall through */ }
  }
  window.open(url, '_blank');
  return { success: true, message: 'Attempted to open browser' };
}
