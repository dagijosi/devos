import { useTheme } from '../../../theme-system';

export function ThemeSettings() {
  const { currentTheme, setTheme, availableThemes } = useTheme();

  const lightThemes = availableThemes.filter((t) => t.mode === 'light');
  const darkThemes = availableThemes.filter((t) => t.mode === 'dark');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-theme-text mb-3">Light Themes</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {lightThemes.map((theme) => (
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
                className="h-12 rounded-lg mb-2 border border-theme-border/20"
                style={{ backgroundColor: theme.colors.background }}
              />
              <span className="text-xs font-medium text-theme-text">{theme.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-theme-text mb-3">Dark Themes</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {darkThemes.map((theme) => (
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
                className="h-12 rounded-lg mb-2 border border-theme-border/20"
                style={{ backgroundColor: theme.colors.background }}
              />
              <span className="text-xs font-medium text-theme-text">{theme.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
