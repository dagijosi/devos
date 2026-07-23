type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: any;
}

const MAX_LOGS = 1000;
const STORAGE_KEY = 'devos_logs';

class Logger {
  private logs: LogEntry[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.logs = JSON.parse(raw);
    } catch { this.logs = []; }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs.slice(-MAX_LOGS)));
    } catch { /* storage full */ }
  }

  private add(level: LogLevel, module: string, message: string, data?: any) {
    const entry: LogEntry = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      data,
    };
    this.logs.push(entry);
    if (this.logs.length > MAX_LOGS * 2) this.logs = this.logs.slice(-MAX_LOGS);
    this.save();
    this.listeners.forEach(fn => fn());
    if (level === 'error') console.error(`[${module}]`, message, data);
    else if (level === 'warn') console.warn(`[${module}]`, message, data);
    else console.log(`[${module}]`, message, data);
  }

  debug(module: string, message: string, data?: any) { this.add('debug', module, message, data); }
  info(module: string, message: string, data?: any) { this.add('info', module, message, data); }
  warn(module: string, message: string, data?: any) { this.add('warn', module, message, data); }
  error(module: string, message: string, data?: any) { this.add('error', module, message, data); }

  getLogs(level?: LogLevel, module?: string): LogEntry[] {
    let filtered = this.logs;
    if (level) filtered = filtered.filter(l => l.level === level);
    if (module) filtered = filtered.filter(l => l.module === module);
    return filtered.slice().reverse();
  }

  clear() {
    this.logs = [];
    localStorage.removeItem(STORAGE_KEY);
    this.listeners.forEach(fn => fn());
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();
export type { LogEntry, LogLevel };
