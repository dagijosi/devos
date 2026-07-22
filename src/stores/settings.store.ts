import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface QuickAction {
  id: string;
  label: string;
  shortcut: string;
  enabled: boolean;
}

interface SettingsState {
  theme: string;
  language: string;
  fontSize: number;
  sidebarCollapsed: boolean;
  autoSave: boolean;
  notificationsEnabled: boolean;
  quickActions: QuickAction[];
  setTheme: (theme: string) => void;
  setLanguage: (language: string) => void;
  setFontSize: (size: number) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setAutoSave: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  toggleQuickAction: (id: string) => void;
  resetSettings: () => void;
}

const defaultQuickActions: QuickAction[] = [
  { id: 'new-project', label: 'New Project', shortcut: 'Cmd+N', enabled: true },
  { id: 'open-terminal', label: 'Open Terminal', shortcut: 'Cmd+`', enabled: true },
  { id: 'search-files', label: 'Search Files', shortcut: 'Cmd+P', enabled: true },
  { id: 'toggle-sidebar', label: 'Toggle Sidebar', shortcut: 'Cmd+B', enabled: true },
];

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'en',
      fontSize: 14,
      sidebarCollapsed: false,
      autoSave: true,
      notificationsEnabled: true,
      quickActions: defaultQuickActions,

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setFontSize: (fontSize) => set({ fontSize }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setAutoSave: (enabled) => set({ autoSave: enabled }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      toggleQuickAction: (id) =>
        set((state) => ({
          quickActions: state.quickActions.map((a) =>
            a.id === id ? { ...a, enabled: !a.enabled } : a
          ),
        })),
      resetSettings: () =>
        set({
          theme: 'system',
          language: 'en',
          fontSize: 14,
          sidebarCollapsed: false,
          autoSave: true,
          notificationsEnabled: true,
          quickActions: defaultQuickActions,
        }),
    }),
    { name: 'developer-os-settings' }
  )
);
