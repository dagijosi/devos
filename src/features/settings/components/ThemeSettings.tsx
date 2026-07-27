import { useState } from 'react';
import { useTheme } from '../../../theme-system';

const PRESET_ACCENTS = ['#2F6FEB', '#4F8EF7', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9'];

export function ThemeSettings() {
  const { currentTheme, setTheme, accentColor, setAccentColor } = useTheme();
  const [customColor, setCustomColor] = useState(accentColor || '');

  const themes = [
    {
      id: 'light',
      label: 'Light',
      primary: '#2F6FEB',
      secondary: '#C99014',
      bg: '#F6F8FB',
      fg: '#182234',
    },
    {
      id: 'dark',
      label: 'Dark',
      primary: '#4F8EF7',
      secondary: '#F4B942',
      bg: '#06080D',
      fg: '#F8FAFC',
    },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-theme-text mb-3">Theme Mode</h3>
      <div className="grid grid-cols-2 gap-3">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => setTheme(theme.id)}
            className={`relative p-3 rounded-xl border text-left transition-all ${
              currentTheme.id === theme.id
                ? 'border-theme-icon ring-2 ring-theme-icon/20 bg-theme-icon/5'
                : 'border-theme-border/30 hover:border-theme-border/60 bg-theme-background/50'
            }`}
          >
            <div
              className="h-12 rounded-lg mb-2 border border-theme-border/20 flex items-center justify-center gap-2 text-xs font-medium"
              style={{ backgroundColor: theme.bg, color: theme.fg }}
            >
              <span style={{ color: theme.primary }}>&#9679;</span>
              <span>DevOS</span>
              <span style={{ color: theme.secondary }}>&#9679;</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.primary }} />
              <span className="text-xs font-medium text-theme-text">{theme.label}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="p-4 rounded-xl border border-theme-border/20 bg-theme-surface/50 space-y-3">
        <h4 className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Accent Color</h4>
        <div className="flex flex-wrap gap-2">
          {PRESET_ACCENTS.map((color) => (
            <button key={color} onClick={() => { setAccentColor(color); setCustomColor(color); }}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                (accentColor || '') === color ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color }} />
          ))}
          <button onClick={() => { setAccentColor(''); setCustomColor(''); }}
            className={`w-7 h-7 rounded-full border-2 border-dashed flex items-center justify-center text-[9px] transition-all ${
              !accentColor ? 'border-white scale-110 shadow-lg' : 'border-theme-border/40 hover:border-theme-text/30'
            }`}
            title="Reset to default">
            <span className="text-theme-text/40">×</span>
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input type="color" value={accentColor || currentTheme.colors.icon} onChange={e => { setAccentColor(e.target.value); setCustomColor(e.target.value); }}
            className="w-8 h-8 rounded cursor-pointer border border-theme-border/30 bg-transparent" />
          <input type="text" value={customColor || currentTheme.colors.icon} onChange={e => { setCustomColor(e.target.value); setAccentColor(e.target.value); }}
            placeholder="#hex"
            className="flex-1 bg-theme-background border border-theme-border/30 rounded-lg px-3 py-1.5 text-xs font-mono text-theme-text outline-none focus:border-theme-icon/50" />
        </div>
      </div>

      <div className="p-4 rounded-xl border border-theme-border/20 bg-theme-surface/50 space-y-3">
        <h4 className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Semantic Colors</h4>
        <div className="flex flex-wrap gap-3">
          {[
            { name: 'Accent', color: accentColor || currentTheme.colors.icon },
            { name: 'Secondary', color: currentTheme.mode === 'dark' ? '#F4B942' : '#C99014' },
            { name: 'Success', color: '#22C55E' },
            { name: 'Warning', color: '#F59E0B' },
            { name: 'Error', color: '#EF4444' },
            { name: 'Info', color: currentTheme.mode === 'dark' ? '#38BDF8' : '#0284C7' },
          ].map((c) => (
            <div key={c.name} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="text-xs text-theme-text/70">{c.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
