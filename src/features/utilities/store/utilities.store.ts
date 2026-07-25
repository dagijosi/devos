import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UtilitiesState {
  activeTool: string | null;
  searchQuery: string;
  activeCategory: string | null;
  showFavoritesOnly: boolean;
  showRecentOnly: boolean;
  setActiveTool: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setActiveCategory: (cat: string | null) => void;
  setShowFavoritesOnly: (v: boolean) => void;
  setShowRecentOnly: (v: boolean) => void;
  toggleFavorite: (toolId: string) => void;
  favoriteTools: string[];
  recentTools: string[];
  logRecentTool: (toolId: string) => void;
}

export const useUtilitiesStore = create<UtilitiesState>()(
  persist(
    (set) => ({
      activeTool: null,
      searchQuery: '',
      activeCategory: null,
      showFavoritesOnly: false,
      showRecentOnly: false,
      favoriteTools: [],
      recentTools: [],
      setActiveTool: (id) => set({ activeTool: id }),
      setSearchQuery: (q) => set({ searchQuery: q, showRecentOnly: false, activeCategory: null }),
      setActiveCategory: (cat) => set({ activeCategory: cat, searchQuery: '', showRecentOnly: false }),
      setShowFavoritesOnly: (v) => set({ showFavoritesOnly: v, showRecentOnly: false }),
      setShowRecentOnly: (v) => set({ showRecentOnly: v, showFavoritesOnly: false, activeCategory: null, searchQuery: '' }),
      toggleFavorite: (toolId) => set((s) => ({
        favoriteTools: s.favoriteTools.includes(toolId)
          ? s.favoriteTools.filter((id) => id !== toolId)
          : [...s.favoriteTools, toolId],
      })),
      logRecentTool: (toolId) => set((s) => ({
        recentTools: [toolId, ...s.recentTools.filter((id) => id !== toolId)].slice(0, 20),
      })),
    }),
    { name: 'devos-utilities' }
  )
);
