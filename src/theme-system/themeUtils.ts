import type { Theme } from './types';

/**
 * Generates a solid dropdown color from a theme's surface color
 * Removes transparency and ensures good contrast
 */
export function generateDropdownColor(theme: Theme): string {
  // If dropdown color is already defined, use it
  if (theme.colors.dropdown) {
    return theme.colors.dropdown;
  }

  const surface = theme.colors.surface;
  
  // If surface is already solid (no rgba/transparency), use it
  if (!surface.includes('rgba') && !surface.includes('hsla')) {
    return surface;
  }

  // For transparent surfaces, create a solid alternative
  if (theme.mode === 'dark') {
    // For dark themes, use a solid dark color
    return theme.colors.background.includes('gradient') 
      ? '#1e293b' // slate-800
      : theme.colors.background;
  } else {
    // For light themes, use white or light surface
    return '#ffffff';
  }
}

/**
 * Ensures all themes have dropdown colors
 */
export function ensureDropdownColors(themes: Theme[]): Theme[] {
  return themes.map(theme => ({
    ...theme,
    colors: {
      ...theme.colors,
      dropdown: generateDropdownColor(theme)
    }
  }));
}