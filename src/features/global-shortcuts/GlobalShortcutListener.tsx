import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/app.store';
import { DASHBOARD, CLIPBOARD } from '../../routes/types/routeConstants';

export function GlobalShortcutListener() {
  const navigate = useNavigate();
  const toggleCommandPalette = useAppStore((s) => s.toggleCommandPalette);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setup = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        unlisten = await listen<string>('global-shortcut', (event) => {
          switch (event.payload) {
            case 'Ctrl+Shift+K':
              toggleCommandPalette();
              break;
            case 'Ctrl+Shift+N':
              navigate(DASHBOARD);
              break;
            case 'Ctrl+Shift+C':
              navigate(CLIPBOARD);
              break;
          }
        });
      } catch {
        // Not in Tauri environment
      }
    };

    setup();

    return () => {
      if (unlisten) unlisten();
    };
  }, [navigate, toggleCommandPalette]);

  return null;
}
