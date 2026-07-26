import { create } from 'zustand';
import { database } from '../../database';

interface ClipboardEntry {
  id: number;
  content: string;
  content_type: string;
  source: string;
  favorite: number;
  created_at: string;
}

interface ClipboardState {
  entries: ClipboardEntry[];
  searchQuery: string;
  loading: boolean;
  setSearchQuery: (query: string) => void;
  loadEntries: () => Promise<void>;
  addEntry: (content: string, contentType?: string, source?: string) => Promise<void>;
  deleteEntry: (id: number) => Promise<void>;
  clearAll: () => Promise<void>;
  toggleFavorite: (id: number) => Promise<void>;
  searchEntries: (query: string) => Promise<void>;
}

export const useClipboardStore = create<ClipboardState>((set) => ({
  entries: [],
  searchQuery: '',
  loading: false,

  setSearchQuery: (query) => set({ searchQuery: query }),

  loadEntries: async () => {
    set({ loading: true });
    const entries = await database.getClipboardEntries();
    set({ entries, loading: false });
  },

  addEntry: async (content, contentType = 'text', source = '') => {
    await database.addClipboardEntry(content, contentType, source);
    const entries = await database.getClipboardEntries();
    set({ entries });
  },

  deleteEntry: async (id) => {
    await database.deleteClipboardEntry(id);
    set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }));
  },

  clearAll: async () => {
    await database.clearClipboardHistory();
    set({ entries: [] });
  },

  toggleFavorite: async (id) => {
    await database.toggleClipboardFavorite(id);
    const entries = await database.getClipboardEntries();
    set({ entries });
  },

  searchEntries: async (query) => {
    set({ loading: true, searchQuery: query });
    if (!query.trim()) {
      const entries = await database.getClipboardEntries();
      set({ entries, loading: false });
      return;
    }
    const entries = await database.searchClipboard(query);
    set({ entries, loading: false });
  },
}));
