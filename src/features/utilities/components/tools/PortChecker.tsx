import { useState } from 'react';

const COMMON_PORTS = [
  { port: 80, service: 'HTTP' }, { port: 443, service: 'HTTPS' }, { port: 22, service: 'SSH' },
  { port: 21, service: 'FTP' }, { port: 25, service: 'SMTP' }, { port: 3306, service: 'MySQL' },
  { port: 5432, service: 'PostgreSQL' }, { port: 6379, service: 'Redis' }, { port: 27017, service: 'MongoDB' },
  { port: 3000, service: 'Dev Server' }, { port: 8080, service: 'HTTP Alt' }, { port: 8443, service: 'HTTPS Alt' },
];

export function PortChecker() {
  const [host, setHost] = useState('localhost');
  const [checks, setChecks] = useState<{ port: number; service: string; status: string }[]>([]);

  const check = async () => {
    const results = COMMON_PORTS.map(p => ({ ...p, status: 'checking...' }));
    setChecks(results);
    for (let i = 0; i < results.length; i++) {
      const p = results[i];
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const url = p.port === 443 || p.port === 8443 ? `https://${host}:${p.port}` : `http://${host}:${p.port}`;
        await fetch(url, { mode: 'no-cors', signal: controller.signal });
        clearTimeout(timeout);
        results[i].status = 'open';
      } catch {
        results[i].status = 'closed/filtered';
      }
      setChecks([...results]);
    }
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50";

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={host} onChange={e => setHost(e.target.value)} placeholder="Hostname or IP" className={`${ic} flex-1`} />
        <button onClick={check} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">Scan</button>
      </div>
      {checks.length > 0 && (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {checks.map((c, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 bg-theme-background rounded-lg text-xs">
              <span className={`w-2 h-2 rounded-full ${c.status === 'open' ? 'bg-green-400' : c.status === 'checking...' ? 'bg-yellow-400 animate-pulse' : 'bg-theme-text/20'}`} />
              <span className="font-mono text-theme-text w-16">{c.port}</span>
              <span className="text-theme-text/60 w-20">{c.service}</span>
              <span className="text-theme-text/40 flex-1">{c.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
