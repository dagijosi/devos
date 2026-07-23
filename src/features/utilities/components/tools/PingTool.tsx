import { useState } from 'react';

export function PingTool() {
  const [host, setHost] = useState('google.com');
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const ping = async () => {
    setRunning(true); setLogs([]);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    for (let i = 0; i < 3; i++) {
      const start = performance.now();
      try {
        // Try fetching a resource from the host to measure latency
        await fetch(`https://${host}/favicon.ico`, { mode: 'no-cors', signal: controller.signal });
        const ms = (performance.now() - start).toFixed(1);
        setLogs(prev => [...prev, `Reply from ${host}: time=${ms}ms`]);
      } catch {
        setLogs(prev => [...prev, `Request to ${host} failed (host may be unreachable)`]);
      }
    }
    clearTimeout(timeout);
    setRunning(false);
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50";

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={host} onChange={e => setHost(e.target.value)} placeholder="Hostname or IP" className={`${ic} flex-1`} />
        <button onClick={ping} disabled={running} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 disabled:opacity-50 transition-colors">{running ? 'Pinging...' : 'Ping'}</button>
      </div>
      <div className="bg-theme-background border border-theme-border/20 rounded-lg p-3 font-mono text-[11px] text-theme-text space-y-1 h-32 overflow-y-auto">
        {logs.length === 0 && <p className="text-theme-text/30">Click Ping to start</p>}
        {logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}
