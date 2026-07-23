import { useEffect, useState } from 'react';
import { FaExclamationTriangle, FaRedo, FaTrash } from 'react-icons/fa';
import { wasCrashed, clearCrashFlag, getLastSession } from '../../utils/crashRecovery';
import { logger } from '../../utils/logger';
import { Portal } from '../ui/overlays/Portal';

export function CrashRecoveryOverlay() {
  const [show, setShow] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    if (wasCrashed()) {
      setSession(getLastSession());
      setShow(true);
      logger.info('CrashRecovery', 'Previous session ended with a crash');
    }
  }, []);

  if (!show) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Crash recovery">
      <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
            <FaExclamationTriangle className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-theme-text">Recovery Mode</h2>
            <p className="text-xs text-theme-text/50">The app closed unexpectedly last time.</p>
          </div>
        </div>

        {session && (
          <div className="bg-theme-background rounded-xl p-3 text-xs text-theme-text/60 space-y-1">
            <p>Last session: <span className="text-theme-text/80">{new Date(session.timestamp).toLocaleString()}</span></p>
            <p>Location: <span className="text-theme-text/80">{session.location}</span></p>
          </div>
        )}

        <p className="text-xs text-theme-text/40">
          Your data is stored safely in the database. No information was lost.
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              clearCrashFlag();
              setShow(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors"
          >
            <FaRedo className="w-3 h-3" /> Continue Safely
          </button>
          <button
            onClick={() => {
              clearCrashFlag();
              logger.clear();
              setShow(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-theme-surface border border-theme-border/50 text-theme-text rounded-xl text-sm hover:bg-theme-surface/80 transition-colors"
          >
            <FaTrash className="w-3 h-3" /> Clear & Continue
          </button>
        </div>
      </div>
    </div>
    </Portal>
  );
}
