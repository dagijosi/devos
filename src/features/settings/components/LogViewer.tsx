import { useState, useEffect, useCallback } from 'react';
import { FaDownload, FaTrash, FaSearch, FaBug, FaInfoCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import type { IconType } from 'react-icons/lib';
import { logger, type LogEntry, type LogLevel } from '../../../utils/logger';

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: 'text-gray-400',
  info: 'text-blue-400',
  warn: 'text-yellow-400',
  error: 'text-red-400',
};

const LEVEL_ICONS: Record<LogLevel, IconType> = {
  debug: FaBug,
  info: FaInfoCircle,
  warn: FaExclamationTriangle,
  error: FaTimes,
};

export function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [search, setSearch] = useState('');

  const refresh = useCallback(() => {
    setLogs(logger.getLogs(filter === 'all' ? undefined : filter));
  }, [filter]);

  useEffect(() => {
    refresh();
    const unsub = logger.subscribe(refresh);
    return () => { unsub(); };
  }, [refresh]);

  const filtered = search
    ? logs.filter(l =>
        l.message.toLowerCase().includes(search.toLowerCase()) ||
        l.module.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {(['all', 'error', 'warn', 'info', 'debug'] as const).map(level => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === level
                  ? 'bg-theme-icon/10 text-theme-icon border border-theme-icon/30'
                  : 'bg-theme-background text-theme-text/50 border border-theme-border/20 hover:border-theme-icon/30'
              }`}
            >
              {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-theme-text/30" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search logs..."
              className="bg-theme-background border border-theme-border/30 rounded-xl pl-8 pr-3 py-1.5 text-xs text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 w-40"
            />
          </div>
          <button
            onClick={() => {
              const blob = new Blob([logger.export()], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `devos-logs-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-surface border border-theme-border/30 rounded-lg text-xs text-theme-text/60 hover:text-theme-icon transition-colors"
          >
            <FaDownload className="w-3 h-3" /> Export
          </button>
          <button
            onClick={() => { logger.clear(); refresh(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-surface border border-theme-border/30 rounded-lg text-xs text-theme-text/60 hover:text-red-400 transition-colors"
          >
            <FaTrash className="w-3 h-3" /> Clear
          </button>
        </div>
      </div>

      <div className="bg-theme-background border border-theme-border/20 rounded-xl max-h-[500px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-theme-text/30">
            <FaBug className="w-8 h-8 mb-2" />
            <p className="text-xs">No logs match your filter</p>
          </div>
        ) : (
          <div className="divide-y divide-theme-border/10">
            {filtered.map(entry => {
              const Icon = LEVEL_ICONS[entry.level];
              return (
                <div key={entry.id} className="px-4 py-2.5 hover:bg-theme-surface/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${LEVEL_COLORS[entry.level]}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-mono uppercase ${LEVEL_COLORS[entry.level]}`}>
                          {entry.level}
                        </span>
                        <span className="text-[10px] font-mono text-theme-text/40">{entry.module}</span>
                        <span className="text-[10px] text-theme-text/30 ml-auto">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-theme-text/80 mt-0.5 break-words">{entry.message}</p>
                      {entry.data && (
                        <pre className="mt-1 text-[10px] text-theme-text/40 font-mono overflow-x-auto">
                          {typeof entry.data === 'string' ? entry.data : JSON.stringify(entry.data, null, 1).slice(0, 200)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-[10px] text-theme-text/30 text-right">
        {filtered.length} entries &middot; Max 1000 stored
      </p>
    </div>
  );
}
