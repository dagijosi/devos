import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { FaTerminal, FaPlus, FaTimes, FaPlay, FaStop } from 'react-icons/fa';
import { isTauri as isTauriRuntime } from '../../lib/tauri';
import { useTheme } from '../../theme-system';
import { getProjectContext } from '../projects/utils/projectContext';

interface Tab {
  id: string;
  title: string;
  terminal: Terminal | null;
  fitAddon: FitAddon | null;
  sessionId: string | null;
  isRunning: boolean;
  disposable: { dispose: () => void } | null;
  cwd?: string;
  command?: string;
}

let tabCounter = 0;

const LIGHT_TERMINAL_THEME = {
  background: '#ffffff',
  foreground: '#1f1f1f',
  cursor: '#1f1f1f',
  selectionBackground: '#d0d0d0',
  black: '#4f4f4f',
  red: '#c41e3a',
  green: '#1a7f37',
  yellow: '#9a6b00',
  blue: '#0550ae',
  magenta: '#8250df',
  cyan: '#1b7c83',
  white: '#656d76',
  brightBlack: '#8b949e',
  brightRed: '#cf222e',
  brightGreen: '#116329',
  brightYellow: '#9a6700',
  brightBlue: '#0969da',
  brightMagenta: '#8250df',
  brightCyan: '#1b7c83',
  brightWhite: '#1f2328',
};

const DARK_TERMINAL_THEME = {
  background: '#0d1117',
  foreground: '#c9d1d9',
  cursor: '#c9d1d9',
  selectionBackground: '#3b4252',
  black: '#484f58',
  red: '#ff7b72',
  green: '#3fb950',
  yellow: '#d29922',
  blue: '#58a6ff',
  magenta: '#bc8cff',
  cyan: '#39c5cf',
  white: '#b1bac4',
  brightBlack: '#6e7681',
  brightRed: '#ffa198',
  brightGreen: '#56d364',
  brightYellow: '#e3b341',
  brightBlue: '#79c0ff',
  brightMagenta: '#d2a8ff',
  brightCyan: '#56d4dd',
  brightWhite: '#f0f6fc',
};

export function TerminalPage() {
  const { currentTheme } = useTheme();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const terminalRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const [isTauri, setIsTauri] = useState(false);
  const [runtimeReady, setRuntimeReady] = useState(false);
  const [shellType, setShellType] = useState<'powershell' | 'cmd' | 'bash'>('cmd');
  const autoStartedRef = useRef(false);

  const isDark = currentTheme.mode === 'dark';
  const terminalTheme = isDark ? DARK_TERMINAL_THEME : LIGHT_TERMINAL_THEME;
  const terminalBg = terminalTheme.background;

  useEffect(() => {
    setIsTauri(isTauriRuntime());
    if (navigator.userAgent.includes('Windows')) {
      setShellType('powershell');
    } else {
      setShellType('bash');
    }
    setRuntimeReady(true);
  }, []);

  const addTab = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const shouldRunConfiguredCommand = !autoStartedRef.current && Boolean(params.get('cmd'));
    const command = shouldRunConfiguredCommand ? params.get('cmd') || undefined : undefined;
    const cwd = shouldRunConfiguredCommand ? params.get('cwd') || undefined : undefined;
    const label = shouldRunConfiguredCommand ? params.get('label') || undefined : undefined;
    if (shouldRunConfiguredCommand) autoStartedRef.current = true;
    tabCounter++;
    const id = `tab-${tabCounter}`;
    const fitAddon = new FitAddon();
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
      theme: terminalTheme,
      allowTransparency: true,
    });

    term.loadAddon(fitAddon);

    const newTab: Tab = {
      id,
      title: label || `Terminal ${tabCounter}`,
      terminal: term,
      fitAddon,
      sessionId: null,
      isRunning: false,
      disposable: null,
      cwd,
      command,
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(id);

    setTimeout(() => {
      const container = terminalRefs.current.get(id);
      if (container && term) {
        term.open(container);
        fitAddon.fit();
        term.focus();

        if (isTauri) {
          startTauriPtyShell(term, id, cwd, command);
        } else {
          startBrowserShell(term, id);
        }
      }
    }, 50);
  }, [isTauri, shellType, terminalTheme]);

  const startTauriPtyShell = async (term: Terminal, tabId: string, configuredCwd?: string, configuredCommand?: string) => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const { listen } = await import('@tauri-apps/api/event');

      const ctx = getProjectContext();
      const cwd = configuredCwd || ctx?.localPath || undefined;

      const result: any = await invoke('create_pty', { cwd: cwd || null });
      const sessionId: string = result.session_id;

      const unlisteners: (() => void)[] = [];

      const unlistenOutput = await listen<any>('pty-output', (event) => {
        const p = event.payload;
        if (p.session_id === sessionId) {
          term.write(p.data.replace(/\n/g, '\r\n'));
        }
      });
      unlisteners.push(unlistenOutput);

      const unlistenExit = await listen<any>('pty-exit', (event) => {
        if (event.payload.session_id === sessionId) {
          term.writeln('\r\n\x1b[31m[Process exited]\x1b[0m');
          setTabs((prev) => prev.map((t) => t.id === tabId ? { ...t, isRunning: false } : t));
        }
      });
      unlisteners.push(unlistenExit);

      const disposable = term.onData((data) => {
        invoke('write_pty', { sessionId, data }).catch(() => {});
      });

      term.writeln('\x1b[36mDevOS Terminal\x1b[0m');
      term.writeln(`\x1b[2mShell: ${shellType}${ctx ? `  |  Project: ${ctx.name}` : ''}\x1b[0m`);

      if (configuredCommand) {
        term.writeln(`\x1b[2mRunning: ${configuredCommand}\x1b[0m`);
        invoke('write_pty', { sessionId, data: `${configuredCommand}\r` }).catch(() => {});
      }

      setTabs((prev) =>
        prev.map((t) =>
          t.id === tabId
            ? { ...t, sessionId, isRunning: true, disposable: { dispose: () => { unlisteners.forEach(u => u()); disposable.dispose(); } } }
            : t
        )
      );
    } catch (err: any) {
      term.writeln(`\x1b[31mFailed to start shell: ${err?.toString() || 'Unknown error'}\x1b[0m`);
    }
  };

  useEffect(() => {
    if (runtimeReady && !autoStartedRef.current && new URLSearchParams(window.location.search).get('cmd')) void addTab();
  }, [addTab, runtimeReady]);

  const startBrowserShell = (term: Terminal, tabId: string) => {
    term.writeln('\x1b[33m\u26a0 Demo Mode \u2014 No shell available\x1b[0m');
    term.writeln('\x1b[2mRun \x1b[0m\x1b[36mnpm run tauri:dev\x1b[0m\x1b[2m for an interactive terminal.\x1b[0m\r\n');
    term.writeln('\x1b[2mAvailable commands in demo mode:\x1b[0m');
    term.writeln('  \x1b[33mclear\x1b[0m  \x1b[2m\u2014 clear screen\x1b[0m');
    term.writeln('  \x1b[33mhelp\x1b[0m   \x1b[2m\u2014 show this message\x1b[0m');
    term.writeln('  \x1b[33mecho\x1b[0m   \x1b[2m\u2014 echo text\x1b[0m\r\n');

    let buffer = '';
    term.onData((data) => {
      const code = data.charCodeAt(0);

      if (code === 13) {
        const cmd = buffer.trim().toLowerCase();
        if (cmd === 'clear') {
          term.clear();
        } else if (cmd === 'help') {
          term.writeln('\r\n\x1b[33mDemo commands:\x1b[0m clear, help, echo');
        } else if (cmd.startsWith('echo ')) {
          term.writeln(`\r\n${cmd.slice(5)}`);
        } else if (cmd) {
          term.writeln(`\r\n\x1b[31mCommand not available in demo mode: ${cmd}\x1b[0m`);
        }
        buffer = '';
        term.write(`\r\n\x1b[32m>\x1b[0m `);
      } else if (code === 127) {
        if (buffer.length > 0) {
          buffer = buffer.slice(0, -1);
          term.write('\b \b');
        }
      } else if (data.length === 1 && data >= ' ') {
        buffer += data;
        term.write(data);
      }
    });

    term.write('\x1b[32m>\x1b[0m ');
    setTabs((prev) => prev.map((t) => t.id === tabId ? { ...t, isRunning: true } : t));
  };

  const closeTab = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const tab = tabs.find((t) => t.id === id);
    if (tab?.terminal) {
      tab.terminal.dispose();
    }
    if (tab?.sessionId && isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('close_pty', { sessionId: tab.sessionId });
      } catch {}
    }
    if (tab?.disposable) {
      try { tab.disposable.dispose(); } catch {}
    }
    terminalRefs.current.delete(id);
    setTabs((prev) => {
      const remaining = prev.filter((t) => t.id !== id);
      if (activeTabId === id && remaining.length > 0) {
        setActiveTabId(remaining[remaining.length - 1].id);
      } else if (remaining.length === 0) {
        setActiveTabId(null);
      }
      return remaining;
    });
  };

  const setTerminalRef = (id: string, el: HTMLDivElement | null) => {
    terminalRefs.current.set(id, el);
  };

  useEffect(() => {
    const handleResize = () => {
      const tab = tabs.find((t) => t.id === activeTabId);
      if (tab?.fitAddon) {
        try { tab.fitAddon.fit(); } catch {}
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [tabs, activeTabId]);

  useEffect(() => {
    const tab = tabs.find((t) => t.id === activeTabId);
    if (tab?.fitAddon) {
      setTimeout(() => {
        try { tab.fitAddon?.fit(); tab.terminal?.focus(); } catch {}
      }, 50);
    }
  }, [activeTabId, tabs]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-0.5 mb-2 overflow-x-auto shrink-0">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-t-lg cursor-pointer transition-colors border-t border-l border-r shrink-0 ${
              activeTabId === tab.id
                ? `text-theme-text border-theme-border/30`
                : 'bg-theme-surface/30 border-transparent text-theme-text/50 hover:text-theme-text/80'
            }`}
            style={activeTabId === tab.id ? { backgroundColor: terminalBg } : {}}
          >
            {tab.isRunning ? (
              <FaPlay className="w-2.5 h-2.5 text-green-500" />
            ) : (
              <FaStop className="w-2.5 h-2.5 text-red-500" />
            )}
            <span className="whitespace-nowrap">{tab.title}</span>
            <button
              onClick={(e) => closeTab(tab.id, e)}
              className="p-0.5 rounded hover:bg-theme-surface/50 text-theme-text/30 hover:text-theme-text/70 transition-colors"
            >
              <FaTimes className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}

        <button
          onClick={addTab}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-theme-text/50 hover:text-theme-text bg-theme-surface/30 hover:bg-theme-surface/50 rounded-lg transition-colors ml-auto shrink-0"
          title="New Terminal"
        >
          <FaPlus className="w-3 h-3" /> New Terminal
        </button>
      </div>

      <div className="flex-1 border border-theme-border/20 rounded-xl overflow-hidden" style={{ backgroundColor: terminalBg }}>
        {tabs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <FaTerminal className="w-12 h-12 text-theme-text/20 mb-4" />
            <p className="text-sm text-theme-text/40 mb-2">No terminals open</p>
            <button
              onClick={addTab}
              className="px-4 py-2 text-xs bg-theme-icon/20 text-theme-icon border border-theme-icon/30 rounded-xl hover:bg-theme-icon/30 transition-colors font-medium"
            >
              Open Terminal
            </button>
            <p className="text-xs text-theme-text/30 mt-4">
              {isTauri
                ? `${shellType} shell \u2014 full interactive terminal`
                : 'Demo mode \u2014 run `npm run tauri:dev` for interactive shell'}
            </p>
          </div>
        ) : (
          tabs.map((tab) => (
            <div
              key={tab.id}
              ref={(el) => setTerminalRef(tab.id, el)}
              className={`h-full ${activeTabId === tab.id ? '' : 'hidden'}`}
              style={{ padding: '4px' }}
            />
          ))
        )}
      </div>
    </div>
  );
}
