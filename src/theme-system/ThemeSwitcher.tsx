import React from 'react';
import { useTheme } from './useTheme';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeSwitcher: React.FC = () => {
  const { currentTheme, setTheme } = useTheme();

  const toggle = () => {
    setTheme(currentTheme.mode === 'dark' ? 'light' : 'dark');
  };

  const isDark = currentTheme.mode === 'dark';

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg text-theme-text/60 hover:text-theme-text hover:bg-theme-surface/50 transition-colors"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <FaMoon className="w-4 h-4" /> : <FaSun className="w-4 h-4" />}
    </button>
  );
};

export default ThemeSwitcher;
