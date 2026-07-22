import { useTheme } from '../../../theme-system';

export function ThemeSettings() {
  const { currentTheme, setTheme } = useTheme();

  const themes = [
    { id: 'light', label: 'Light', bg: '#f8fafc', fg: '#0f172a' },
    { id: 'dark', label: 'Dark', bg: '#0f172a', fg: '#e2e8f0' },
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
              className="h-12 rounded-lg mb-2 border border-theme-border/20 flex items-center justify-center text-xs font-medium"
              style={{ backgroundColor: theme.bg, color: theme.fg }}
            >
              Aa
            </div>
            <span className="text-xs font-medium text-theme-text">{theme.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
