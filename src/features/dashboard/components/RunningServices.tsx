import { useState, useEffect } from 'react';
import { FaServer, FaCircle, FaDatabase, FaCog } from 'react-icons/fa';

interface Service {
  name: string;
  status: 'running' | 'stopped' | 'connected';
  port?: number;
  icon: any;
}

const defaultServices: Service[] = [
  { name: 'Frontend', status: 'running', port: 5173, icon: FaServer },
  { name: 'Backend', status: 'stopped', port: 3000, icon: FaServer },
  { name: 'Database', status: 'connected', icon: FaDatabase },
  { name: 'LM Studio', status: 'stopped', icon: FaCog },
];

const statusConfig = {
  running: { color: 'text-green-400', dot: 'text-green-400', label: 'Running' },
  connected: { color: 'text-blue-400', dot: 'text-blue-400', label: 'Connected' },
  stopped: { color: 'text-gray-400', dot: 'text-gray-400', label: 'Stopped' },
};

export function RunningServices() {
  const [services] = useState<Service[]>(defaultServices);
  const [detecting, setDetecting] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setDetecting(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (detecting) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-theme-border/10" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-theme-border/10 rounded w-1/3" />
              <div className="h-2 bg-theme-border/10 rounded w-1/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {services.map(s => {
        const cfg = statusConfig[s.status];
        const Icon = s.icon;
        return (
          <div key={s.name} className="flex items-center gap-3 p-3 rounded-xl hover:bg-theme-background/20 transition-colors">
            <div className={`w-8 h-8 rounded-lg bg-theme-background/50 flex items-center justify-center ${cfg.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-theme-text">{s.name}</p>
                <FaCircle className={`w-2 h-2 ${cfg.dot}`} />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-theme-text/40">
                <span>{cfg.label}</span>
                {s.port && <span>&middot; Port {s.port}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
