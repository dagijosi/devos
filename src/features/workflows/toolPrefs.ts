const STORAGE_KEY = 'devos_tool_prefs';

export interface ToolPrefs {
  editor: { type: string; path: string; label: string };
  browser: { type: string; path: string; label: string };
}

const DEFAULTS: ToolPrefs = {
  editor: { type: 'vscode', path: 'code', label: 'VS Code' },
  browser: { type: 'default', path: '', label: 'System Default' },
};

const EDITOR_OPTIONS = [
  { type: 'vscode', label: 'VS Code', command: 'code' },
  { type: 'cursor', label: 'Cursor', command: 'cursor' },
  { type: 'windsurf', label: 'Windsurf', command: 'windsurf' },
  { type: 'webstorm', label: 'WebStorm', command: 'webstorm' },
  { type: 'custom', label: 'Custom...', command: '' },
] as const;

const BROWSER_OPTIONS = [
  { type: 'default', label: 'System Default', command: '' },
  { type: 'chrome', label: 'Google Chrome', command: 'chrome' },
  { type: 'firefox', label: 'Firefox', command: 'firefox' },
  { type: 'edge', label: 'Microsoft Edge', command: 'msedge' },
  { type: 'brave', label: 'Brave', command: 'brave' },
  { type: 'custom', label: 'Custom...', command: '' },
] as const;

export function loadPrefs(): ToolPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch { return DEFAULTS; }
}

export function savePrefs(prefs: ToolPrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function getEditorCommand(prefs: ToolPrefs): string {
  if (prefs.editor.type === 'custom') return prefs.editor.path || 'code';
  const opt = EDITOR_OPTIONS.find(o => o.type === prefs.editor.type);
  return opt?.command || 'code';
}

export function getBrowserCommand(prefs: ToolPrefs): string {
  if (prefs.browser.type === 'custom') return prefs.browser.path || '';
  const opt = BROWSER_OPTIONS.find(o => o.type === prefs.browser.type);
  return opt?.command || '';
}

export { EDITOR_OPTIONS, BROWSER_OPTIONS };
