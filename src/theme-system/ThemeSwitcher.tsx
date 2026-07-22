import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from './useTheme';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeSwitcher: React.FC = () => {
  const { currentTheme, setTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDark = currentTheme.mode === 'dark';

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-theme-text/60 hover:text-theme-text hover:bg-theme-surface/50 transition-colors"
        aria-label="Toggle theme"
      >
        {isDark ? <FaMoon className="w-4 h-4" /> : <FaSun className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-theme-surface border border-theme-border/30 rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="p-2">
            {availableThemes.slice(0, 8).map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  setTheme(theme.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-left transition-colors ${
                  currentTheme.id === theme.id
                    ? 'bg-theme-icon/10 text-theme-icon'
                    : 'text-theme-text/60 hover:text-theme-text hover:bg-theme-background/50'
                }`}
              >
                <div
                  className="w-6 h-6 rounded-lg border border-theme-border/20 flex-shrink-0"
                  style={{ backgroundColor: theme.colors.background }}
                />
                <span className="flex-1">{theme.name}</span>
                {currentTheme.id === theme.id && (
                  <svg className="w-3.5 h-3.5 text-theme-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
