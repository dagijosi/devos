import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { FaTerminal as FaTermIcon, FaPlay, FaStop } from 'react-icons/fa';
import { isTauri } from '../../../../lib/tauri';

interface Props {
  localPath?: string;
}

const DARK_TERMINAL_THEME = {
  background: '#0d1117', foreground: '#c9d1d9', cursor: '#c9d1d9',
  selectionBackground: '#3b4252', black: '#484f58', red: '#ff7b72',
  green: '#3fb950', yellow: '#d29922', blue: '#58a6ff', magenta: '#bc8cff',
  cyan: '#39c5cf', white: '#b1bac4', brightBlack: '#6e7681', brightRed: '#ffa198',
  brightGreen: '#56d364', brightYellow: '#e3b341', brightBlue: '#79c0ff',
  brightMagenta: '#d2a8ff', brightCyan: '#56d4dd', brightWhite: '#f0f6fc',
};

export function TerminalTab({ localPath }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const termRef = useRef<Terminal | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const unlistenersRef = useRef<(() => void)[]>([]);
  const disposableRef = useRef<{ dispose: () => void } | null>(null);

  useEffect(() => {
    if (!showTerminal || !containerRef.current || !isTauri() || !localPath) return;
    const term = new Terminal({ cursorBlink: true, cursorStyle: 'bar', fontSize: 13, fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace", theme: DARK_TERMINAL_THEME, allowTransparency: true });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();
    term.focus();
    termRef.current = term;

    const start = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const { listen } = await import('@tauri-apps/api/event');

        const result: any = await invoke('create_pty', { cwd: localPath });
        const sessionId: string = result.session_id;
        sessionIdRef.current = sessionId;

        const unlistenOutput = await listen<any>('pty-output', (event) => {
          if (event.payload.session_id === sessionId) {
            term.write(event.payload.data.replace(/\n/g, '\r\n'));
          }
        });
        unlistenersRef.current.push(unlistenOutput);

        const unlistenExit = await listen<any>('pty-exit', (event) => {
          if (event.payload.session_id === sessionId) {
            setRunning(false);
            term.writeln('\r\n\x1b[31m[Process exited]\x1b[0m');
          }
        });
        unlistenersRef.current.push(unlistenExit);

        disposableRef.current = term.onData((data) => {
          invoke('write_pty', { sessionId, data }).catch(() => {});
        });

        term.writeln(`\x1b[36mDevOS Terminal \u2014 ${localPath}\x1b[0m`);
        setRunning(true);
      } catch (e: any) {
        term.writeln(`\x1b[31mFailed: ${e?.toString() || 'Unknown'}\x1b[0m`);
      }
    };
    start();

    const onResize = () => { try { fitAddon.fit(); } catch {} };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      const sid = sessionIdRef.current;
      if (sid) {
        import('@tauri-apps/api/core').then(({ invoke }) => invoke('close_pty', { sessionId: sid }).catch(() => {}));
      }
      unlistenersRef.current.forEach(u => u());
      try { disposableRef.current?.dispose(); } catch {}
      try { term.dispose(); } catch {}
    };
  }, [showTerminal, localPath]);

  if (!localPath) {
    return (
      <div className="text-center py-12">
        <FaTermIcon className="w-10 h-10 text-theme-text/20 mx-auto mb-3" />
        <p className="text-sm text-theme-text/40">Set a local path for this project to open a terminal</p>
      </div>
    );
  }

  if (!showTerminal) {
    return (
      <div className="text-center py-12 space-y-4">
        <FaTermIcon className="w-12 h-12 text-theme-text/20 mx-auto" />
        <p className="text-sm text-theme-text/40">Open a terminal at the project root</p>
        <p className="text-xs text-theme-text/30 font-mono">{localPath}</p>
        <button onClick={() => setShowTerminal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-theme-icon text-white rounded-xl hover:bg-theme-icon/90 transition-colors">
          <FaPlay className="w-3 h-3" /> Open Terminal
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-theme-text/50">
        <span className={`flex items-center gap-1 ${running ? 'text-green-400' : 'text-red-400'}`}>
          {running ? <FaPlay className="w-2.5 h-2.5" /> : <FaStop className="w-2.5 h-2.5" />}
          {running ? 'Running' : 'Stopped'}
        </span>
        <span className="font-mono truncate">{localPath}</span>
      </div>
      <div ref={containerRef} className="border border-theme-border/20 rounded-xl overflow-hidden" style={{ height: '400px' }} />
    </div>
  );
}
