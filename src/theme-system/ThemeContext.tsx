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
    root.style.setProperty('--color-text', currentTheme.colors.text);
    root.style.setProperty('--color-icon', currentTheme.colors.icon);
    root.style.setProperty('--color-border', currentTheme.colors.border);
    root.style.setProperty('--color-surface', currentTheme.colors.surface);

    const mutedColor = currentTheme.colors.muted || currentTheme.colors.text + 'b3';
    root.style.setProperty('--color-muted', mutedColor);

    const accentColor = currentTheme.colors.accent || currentTheme.colors.icon;
    root.style.setProperty('--color-accent', accentColor);

    const dropdownColor = currentTheme.colors.dropdown || currentTheme.colors.surface;
    root.style.setProperty('--color-dropdown', dropdownColor);

    root.style.setProperty('--color-background', currentTheme.colors.background);
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
