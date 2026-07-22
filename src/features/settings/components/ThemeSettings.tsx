import { useTheme } from '../../../theme-system';

export function ThemeSettings() {
  const { currentTheme, setTheme } = useTheme();

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
        <h4 className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Semantic Colors</h4>
        <div className="flex flex-wrap gap-3">
          {[
            { name: 'Primary', color: currentTheme.mode === 'dark' ? '#4F8EF7' : '#2F6FEB' },
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
