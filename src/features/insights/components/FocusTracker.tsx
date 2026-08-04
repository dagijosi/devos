import { useEffect, useRef } from 'react';
import { useActiveProjectStore } from '../../../stores/activeProject.store';
import { useActivitySignal } from '../activitySignal.store';
import { database } from '../../../database';

const isTauri = typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;
const IDLE_MS = 3 * 60 * 1000; // consider work ended after 3 min of no signals
const FLUSH_MINUTES = 1; // flush a focus row once per minute of work

/**
 * Renders nothing. While mounted it watches the active project's folder and
 * logs focus time into activity_logs whenever file changes, terminal usage,
 * or editor-launch signals indicate the user is working.
 */
export function FocusTracker() {
  const activeProject = useActiveProjectStore((s) => s.activeProject);
  const signal = useRef(useActivitySignal.getState());

  useEffect(() => {
    signal.current = useActivitySignal.getState();
    const unsub = useActivitySignal.subscribe((s) => { signal.current = s; });
    return unsub;
  }, []);

  useEffect(() => {
    if (!isTauri) return;

    const path = activeProject?.localPath || null;
    let unlistenFs: (() => void) | undefined;
    let cancelled = false;

    useActivitySignal.getState().setCapturing(false, null);
    let lastCapturing = false;

    const setup = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const { listen } = await import('@tauri-apps/api/event');
        if (path) {
          await invoke('start_watching', { path }).catch(() => {});
        }
        unlistenFs = await listen<string[]>('fs-change', () => {
          useActivitySignal.getState().markActivity();
        });
        if (cancelled) unlistenFs?.();
      } catch {
        /* ignore */
      }
    };
    setup();

    let accumulated = 0;
    let startedAt: string | null = null;

    const timer = setInterval(() => {
      const now = Date.now();
      const sig = signal.current;
      const working = !!activeProject &&
        (now - sig.lastActivityAt < IDLE_MS || now < sig.creditUntil);

      if (working !== lastCapturing) {
        lastCapturing = working;
        useActivitySignal.getState().setCapturing(working, activeProject?.name || null);
      }

      if (working) {
        if (!startedAt) startedAt = new Date().toISOString();
        accumulated += 1;
        if (accumulated >= FLUSH_MINUTES * 60) {
          database.logActivity({
            project_id: activeProject.id,
            type: 'focus',
            description: activeProject.name,
            duration: FLUSH_MINUTES,
            started_at: startedAt,
          }).catch(() => {});
          accumulated = 0;
          startedAt = new Date().toISOString();
        }
      } else {
        accumulated = 0;
        startedAt = null;
      }
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(timer);
      unlistenFs?.();
      useActivitySignal.getState().setCapturing(false, null);
      if (isTauri && path) {
        import('@tauri-apps/api/core').then(({ invoke }) => invoke('stop_watching', { path }).catch(() => {}));
      }
    };
  }, [activeProject?.id, activeProject?.localPath, activeProject?.name]);

  return null;
}