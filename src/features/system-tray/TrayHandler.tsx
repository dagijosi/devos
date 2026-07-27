import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/app.store';
import { PROJECTS, TERMINAL, CLIPBOARD } from '../../routes/types/routeConstants';

function focusWindow() {
  try {
    if (window.__TAURI_INTERNALS__) {
      import('@tauri-apps/api/window').then(({ getCurrentWindow }) =>
        getCurrentWindow().setFocus()
      ).catch(() => {});
    }
  } catch {}
}

export function TrayHandler() {
  const navigate = useNavigate();
  const toggleCommandPalette = useAppStore((s) => s.toggleCommandPalette);

  useEffect(() => {
    if (!window.__TAURI_INTERNALS__) return;
    let unlistenTray: (() => void) | undefined;
    let unlistenIpc: (() => void) | undefined;

    const setup = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');

        unlistenTray = await listen<string>('tray-action', (event) => {
          switch (event.payload) {
            case 'terminal':
              navigate(TERMINAL);
              break;
            case 'clipboard':
              navigate(CLIPBOARD);
              break;
            case 'search':
              toggleCommandPalette();
              break;
          }
          focusWindow();
        });

        unlistenIpc = await listen<string>('ipc-command', (event) => {
          try {
            const cmd = JSON.parse(event.payload);
            switch (cmd.action) {
              case 'open':
                if (cmd.payload) {
                  localStorage.setItem('devos_open_path', cmd.payload);
                }
                navigate(PROJECTS);
                break;
              case 'terminal':
                navigate(TERMINAL);
                break;
              case 'clipboard':
                navigate(CLIPBOARD);
                break;
              case 'search':
                if (cmd.payload) {
                  localStorage.setItem('devos_search_query', cmd.payload);
                }
                toggleCommandPalette();
                break;
              case 'focus':
                focusWindow();
                break;
            }
            focusWindow();
          } catch {}
        });
      } catch {}
    };

    setup();

    return () => {
      unlistenTray?.();
      unlistenIpc?.();
    };
  }, [navigate, toggleCommandPalette]);

  return null;
}
