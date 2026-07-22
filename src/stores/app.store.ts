import { create } from 'zustand';

type ThemeMode = 'light' | 'dark' | 'system';

interface AppState {
  sidebarOpen: boolean;
  sidebarExpanded: boolean;
  commandPaletteOpen: boolean;
  themeMode: ThemeMode;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  sidebarExpanded: true,
  commandPaletteOpen: false,
  themeMode: (localStorage.getItem('theme-mode') as ThemeMode) || 'system',

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  setThemeMode: (mode) => {
    localStorage.setItem('theme-mode', mode);
    set({ themeMode: mode });
  },
}));
