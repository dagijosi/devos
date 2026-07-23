import { useEffect } from 'react';
import { useToolboxStore } from '../store/toolbox.store';
import { toolDefinitions } from '../toolDefinitions';

export function useKeyboardShortcuts() {
  const { setActiveTool, setSearchQuery, searchQuery, activeTool, setShowFavoritesOnly, showFavoritesOnly } = useToolboxStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
      const key = e.key.toLowerCase();

      if (ctrl && key === 'f' && !activeTool) {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>('input[placeholder*="Search tools"]');
        input?.focus();
        return;
      }

      if (ctrl && key === 'f' && activeTool) {
        return;
      }

      const shortcuts = ['1', '2', '3', '4', '5', '6', '7'];
      if (ctrl && shortcuts.includes(key)) {
        e.preventDefault();
        const idx = parseInt(key) - 1;
        const tool = toolDefinitions[idx];
        if (tool) setActiveTool(tool.id);
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, setActiveTool]);
}
