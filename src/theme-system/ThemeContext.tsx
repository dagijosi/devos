import React, { createContext, useEffect, useState } from 'react';
import type { Theme } from './types';
import { themes, defaultTheme, defaultDarkTheme } from './themes';

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentThemeState] = useState<Theme>(() => {
    const savedThemeId = localStorage.getItem('app-theme-id');
    if (savedThemeId) {
      const savedTheme = themes.find(t => t.id === savedThemeId);
      if (savedTheme) return savedTheme;
    }
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return defaultDarkTheme;
    }
    return defaultTheme;
  });

  const setTheme = (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId);
    if (theme) {
      setCurrentThemeState(theme);
      localStorage.setItem('app-theme-id', theme.id);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    const c = currentTheme.colors;

    root.style.setProperty('--color-background', c.background);
    root.style.setProperty('--color-text', c.text);
    root.style.setProperty('--color-textSecondary', c.textSecondary || c.text);
    root.style.setProperty('--color-muted', c.muted || c.text + 'b3');
    root.style.setProperty('--color-icon', c.icon);
    root.style.setProperty('--color-accent', c.accent || c.icon);
    root.style.setProperty('--color-border', c.border);
    root.style.setProperty('--color-surface', c.surface);
    root.style.setProperty('--color-dropdown', c.dropdown || c.surface);
    root.style.setProperty('--color-hover', c.hover || c.surface);
    root.style.setProperty('--color-success', c.success || '#22C55E');
    root.style.setProperty('--color-warning', c.warning || '#F59E0B');
    root.style.setProperty('--color-error', c.error || '#EF4444');
    root.style.setProperty('--color-info', c.info || '#38BDF8');
    root.style.setProperty('--color-secondary', c.secondary || c.icon);

    root.style.setProperty('--background-image', 'none');
    root.style.setProperty('--background-blend-mode', 'normal');
    root.style.setProperty('--background-size', 'cover');
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeContext };
