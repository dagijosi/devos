import { useState, useEffect, useRef } from 'react';

const isTauri = typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;

interface UseFileWatcherResult {
  changes: string[];
  watching: boolean;
}

export function useFileWatcher(path: string | null): UseFileWatcherResult {
  const [changes, setChanges] = useState<string[]>([]);
  const [watching, setWatching] = useState(false);
  const unlistenRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    if (!path || !isTauri) return;

    let cancelled = false;

    const setup = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const { listen } = await import('@tauri-apps/api/event');

        await invoke('start_watching', { path });
        if (cancelled) return;
        setWatching(true);

        const unlisten = await listen<string[]>('fs-change', (event) => {
          if (!cancelled) setChanges(event.payload);
        });

        if (cancelled) {
          unlisten();
          return;
        }

        unlistenRef.current = unlisten;
      } catch {

      }
    };

    setup();

    return () => {
      cancelled = true;
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = undefined;
      }
      if (isTauri) {
        import('@tauri-apps/api/core').then(({ invoke }) => {
          invoke('stop_watching', { path }).catch(() => {});
        });
      }
      setWatching(false);
    };
  }, [path]);

  if (!isTauri) {
    return { changes: [], watching: false };
  }

  return { changes, watching };
}
