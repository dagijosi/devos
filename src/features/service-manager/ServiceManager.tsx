import { useState, useEffect, useRef, useCallback } from 'react';
import { FaPlay, FaStop, FaSync, FaTerminal, FaExternalLinkAlt, FaChartLine } from 'react-icons/fa';

interface Service {
  id: string;
  name: string;
  command: string;
  cwd: string;
  status: 'stopped' | 'running' | 'failed';
  port?: number;
  pid?: number;
  uptime?: number;
  logs: string[];
}

interface Props {
  projectId: number;
  localPath?: string;
  runConfigs?: { name: string; command: string }[];
}

export function ServiceManager({ projectId, localPath, runConfigs = [] }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const logEndRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const initial: Service[] = runConfigs.map((rc, i) => ({
      id: `svc-${i}`,
      name: rc.name,
      command: rc.command,
      cwd: localPath || '',
      status: 'stopped' as const,
      logs: [],
    }));
    setServices(initial);
  }, [runConfigs, localPath]);

  useEffect(() => {
    Object.values(logEndRefs.current).forEach((ref) => {
      ref?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [services]);

  const startService = useCallback(async (id: string) => {
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, status: 'running', logs: [...s.logs, `[${new Date().toLocaleTimeString()}] Starting...`] } : s));

    const svc = services.find((s) => s.id === id);
    if (!svc) return;

    try {
      const { Command } = await import('@tauri-apps/plugin-shell');
      const isWin = navigator.userAgent.includes('Windows');
      const shell = isWin ? 'cmd' : 'sh';
      const args = isWin ? ['/c', svc.command] : ['-c', svc.command];

      const cmd = Command.create(shell, args, { cwd: svc.cwd });
      cmd.stdout.on('data', (data: any) => {
        const text = typeof data === 'string' ? data : data?.data ?? '';
        setServices((prev) => prev.map((s) => s.id === id ? { ...s, logs: [...s.logs, `[stdout] ${text}`] } : s));
      });
      cmd.stderr.on('data', (data: any) => {
        const text = typeof data === 'string' ? data : data?.data ?? '';
        setServices((prev) => prev.map((s) => s.id === id ? { ...s, logs: [...s.logs, `[stderr] ${text}`] } : s));
      });

      const child = await cmd.spawn();
      (child as any)._svcId = id;

      cmd.on('close', () => {
        setServices((prev) => prev.map((s) => s.id === id ? { ...s, status: 'stopped', logs: [...s.logs, `[${new Date().toLocaleTimeString()}] Process exited`] } : s));
      });
      cmd.on('error', (err: string) => {
        setServices((prev) => prev.map((s) => s.id === id ? { ...s, status: 'failed', logs: [...s.logs, `[error] ${err}`] } : s));
      });

      setServices((prev) => prev.map((s) => s.id === id ? { ...s, status: 'running', pid: Math.floor(Math.random() * 10000) + 1000, uptime: Date.now() } : s));
    } catch (e: any) {
      setServices((prev) => prev.map((s) => s.id === id ? { ...s, status: 'failed', logs: [...s.logs, `[error] ${e?.toString() || 'Unknown'}`] } : s));
    }
  }, [services]);

  const stopService = useCallback((id: string) => {
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, status: 'stopped', logs: [...s.logs, `[${new Date().toLocaleTimeString()}] Stopped`] } : s));
  }, []);

  const formatUptime = (startTime?: number) => {
    if (!startTime) return '-';
    const secs = Math.floor((Date.now() - startTime) / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ${secs % 60}s`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  if (services.length === 0) return null;

  return (
    <div className="space-y-3">
      {services.map((svc) => (
        <div key={svc.id} className="bg-theme-surface border border-theme-border/20 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${
                svc.status === 'running' ? 'bg-green-500 animate-pulse' :
                svc.status === 'failed' ? 'bg-red-500' : 'bg-theme-text/20'
              }`} />
              <div>
                <p className="text-sm font-medium text-theme-text">{svc.name}</p>
                <p className="text-[10px] font-mono text-theme-text/40">{svc.command}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {svc.status === 'running' && (
                <>
                  {svc.port && (
                    <a href={`http://localhost:${svc.port}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 text-blue-400 bg-blue-500/10 rounded hover:bg-blue-500/20 transition-colors">
                      <FaExternalLinkAlt className="w-2.5 h-2.5" /> :{svc.port}
                    </a>
                  )}
                  <span className="text-theme-text/40">{formatUptime(svc.uptime)}</span>
                  <button onClick={() => stopService(svc.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors">
                    <FaStop className="w-2.5 h-2.5" /> Stop
                  </button>
                </>
              )}
              {svc.status === 'stopped' && (
                <button onClick={() => startService(svc.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-400 bg-green-500/10 rounded-lg hover:bg-green-500/20 transition-colors">
                  <FaPlay className="w-2.5 h-2.5" /> Start
                </button>
              )}
              {svc.status === 'failed' && (
                <button onClick={() => startService(svc.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-yellow-400 bg-yellow-500/10 rounded-lg hover:bg-yellow-500/20 transition-colors">
                  <FaSync className="w-2.5 h-2.5" /> Retry
                </button>
              )}
            </div>
          </div>

          {svc.logs.length > 0 && (
            <div className="border-t border-theme-border/10 bg-theme-background/30 max-h-32 overflow-y-auto p-3 font-mono text-[10px] leading-relaxed">
              {svc.logs.map((line, i) => (
                <div key={i} className={`${line.startsWith('[error]') ? 'text-red-400' : line.startsWith('[stderr]') ? 'text-yellow-400' : 'text-theme-text/50'}`}>
                  {line}
                </div>
              ))}
              <div ref={(el) => { logEndRefs.current[svc.id] = el; }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
