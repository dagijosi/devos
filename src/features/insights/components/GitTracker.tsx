import { useEffect, useRef } from 'react';
import { useProjects } from '../../projects/hooks/useProjects';
import { database } from '../../../database';

const isTauri = typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;

interface GitCommitEvent {
  path: string;
  commits: string[];
}

/**
 * Renders nothing. Starts the Rust git tracker for every project with a
 * local path, and logs new commits as activity (type 'commit').
 */
export function GitTracker() {
  const { projects } = useProjects();
  const trackedPaths = useRef<string[]>([]);

  useEffect(() => {
    if (!isTauri) return;
    const paths = projects
      .map((p) => p.local_path)
      .filter((p): p is string => !!p);

    const prev = trackedPaths.current;
    const started: string[] = [];
    paths.forEach((p) => {
      if (!prev.includes(p)) {
        started.push(p);
        import('@tauri-apps/api/core').then(({ invoke }) => invoke('start_git_tracking', { path: p }).catch(() => {}));
      }
    });
    prev.forEach((p) => {
      if (!paths.includes(p)) {
        import('@tauri-apps/api/core').then(({ invoke }) => invoke('stop_git_tracking', { path: p }).catch(() => {}));
      }
    });
    trackedPaths.current = paths;
    void started;
  }, [projects]);

  useEffect(() => {
    if (!isTauri) return;
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    const setup = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        unlisten = await listen<GitCommitEvent>('git-commits', (event) => {
          const { path, commits } = event.payload;
          const project = projects.find((p) => p.local_path === path);
          commits.forEach((raw) => {
            const idx = raw.indexOf('|');
            const message = (idx >= 0 ? raw.slice(idx + 1) : raw).trim().slice(0, 100);
            database.logActivity({
              project_id: project?.id,
              type: 'commit',
              description: message || 'Commit',
            }).catch(() => {});
          });
        });
        if (cancelled) unlisten?.();
      } catch {
        /* ignore */
      }
    };
    setup();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [projects]);

  return null;
}