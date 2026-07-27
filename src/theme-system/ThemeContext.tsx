import React, { createContext, useEffect, useState } from 'react';
import type { Theme } from './types';
import { themes, defaultTheme, defaultDarkTheme } from './themes';

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_ACCENTS: Record<string, string> = {
  light: '#2F6FEB',
  dark: '#4F8EF7',
};

const THEME_CHANGE_EVENT = 'app-theme-change';

function themeFromStorage(): Theme {
  const savedThemeId = localStorage.getItem('app-theme-id');
  if (savedThemeId) {
    const savedTheme = themes.find(t => t.id === savedThemeId);
    if (savedTheme) return savedTheme;
  }
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return defaultDarkTheme;
  }
  return defaultTheme;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentThemeState] = useState<Theme>(themeFromStorage);
  const [accentColor, setAccentColorState] = useState<string>(() => localStorage.getItem('app-accent-color') || '');

  useEffect(() => {
    const handler = () => setCurrentThemeState(themeFromStorage());
    window.addEventListener(THEME_CHANGE_EVENT, handler);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, handler);
  }, []);

  const setTheme = (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId);
    if (theme) {
      setCurrentThemeState(theme);
      localStorage.setItem('app-theme-id', theme.id);
    }
  };

  const setAccentColor = (color: string) => {
    setAccentColorState(color);
    localStorage.setItem('app-accent-color', color);
  };

  const effectiveAccent = accentColor || DEFAULT_ACCENTS[currentTheme.id] || currentTheme.colors.icon;

  useEffect(() => {
    const root = document.documentElement;
    const c = currentTheme.colors;

    root.style.setProperty('--color-background', c.background);
    root.style.setProperty('--color-text', c.text);
    root.style.setProperty('--color-textSecondary', c.textSecondary || c.text);
    root.style.setProperty('--color-muted', c.muted || c.text + 'b3');
    root.style.setProperty('--color-icon', effectiveAccent);
    root.style.setProperty('--color-accent', effectiveAccent);
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
  }, [currentTheme, effectiveAccent]);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeContext };
