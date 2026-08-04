import { useState, useEffect, useCallback } from 'react';

export interface DetectedEditor {
  id: string;
  name: string;
  program: string;
  isScript: boolean;
}

export function useDetectedEditors() {
  const [editors, setEditors] = useState<DetectedEditor[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;
    if (!isTauri) {
      setEditors([]);
      setLoaded(true);
      return;
    }
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = (await invoke('detect_editors')) as DetectedEditor[];
      setEditors(result || []);
    } catch {
      setEditors([]);
    }
    setLoaded(true);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { editors, loaded, refresh };
}
