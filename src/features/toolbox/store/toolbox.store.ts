import { create } from 'zustand';

interface ToolboxState {
  favoriteTools: string[];
  recentTools: string[];
  activeTool: string | null;
  searchQuery: string;
  showFavoritesOnly: boolean;
  toggleFavorite: (id: string) => void;
  setActiveTool: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setShowFavoritesOnly: (show: boolean) => void;
}

const STORAGE_KEY = 'devos_toolbox';

function loadFromStorage(): { favoriteTools: string[]; recentTools: string[] } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { favoriteTools: [], recentTools: [] };
}

function saveToStorage(favoriteTools: string[], recentTools: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ favoriteTools, recentTools }));
  } catch { /* ignore */ }
}

const initial = loadFromStorage();

export const useToolboxStore = create<ToolboxState>((set, get) => ({
  favoriteTools: initial.favoriteTools,
  recentTools: initial.recentTools,
  activeTool: null,
  searchQuery: '',
  showFavoritesOnly: false,

  toggleFavorite: (id) => {
    const { favoriteTools, recentTools } = get();
    const updated = favoriteTools.includes(id)
      ? favoriteTools.filter(f => f !== id)
      : [...favoriteTools, id];
    set({ favoriteTools: updated });
    saveToStorage(updated, recentTools);
  },

  setActiveTool: (id) => {
    if (!id) {
      set({ activeTool: null });
      return;
    }
    const { recentTools, favoriteTools } = get();
    const updated = [id, ...recentTools.filter(t => t !== id)].slice(0, 20);
    set({ activeTool: id, recentTools: updated });
    saveToStorage(favoriteTools, updated);
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setShowFavoritesOnly: (show) => set({ showFavoritesOnly: show }),
}));
