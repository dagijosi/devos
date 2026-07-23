import { logger } from './logger';

const SESSION_KEY = 'devos_session_backup';
const CRASH_FLAG_KEY = 'devos_crashed';

interface SessionState {
  timestamp: string;
  location: string;
  sidebarOpen: boolean;
  themeMode: string;
  activeNotifications: number;
}

export function saveSessionSnapshot(state: Partial<SessionState>) {
  try {
    const snapshot: SessionState = {
      timestamp: new Date().toISOString(),
      location: window.location.pathname,
      sidebarOpen: true,
      themeMode: 'system',
      activeNotifications: 0,
      ...state,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(snapshot));
  } catch { /* ignore */ }
}

export function getLastSession(): SessionState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function markCrashed() {
  try {
    localStorage.setItem(CRASH_FLAG_KEY, 'true');
    localStorage.setItem('devos_crash_time', new Date().toISOString());
  } catch { /* ignore */ }
}

export function clearCrashFlag() {
  try { localStorage.removeItem(CRASH_FLAG_KEY); } catch { /* ignore */ }
}

export function wasCrashed(): boolean {
  try { return localStorage.getItem(CRASH_FLAG_KEY) === 'true'; } catch { return false; }
}

export function setupCrashDetection() {
  const originalHandler = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    markCrashed();
    logger.error('CrashRecovery', 'Uncaught error detected', {
      message, source, lineno, colno, error: error?.stack
    });
    originalHandler?.call(window, message, source, lineno, colno, error);
  };

  window.addEventListener('unhandledrejection', (event) => {
    markCrashed();
    logger.error('CrashRecovery', 'Unhandled promise rejection', {
      reason: event.reason?.stack || event.reason
    });
  });
}
