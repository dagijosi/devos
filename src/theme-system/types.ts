export interface Theme {
  id: string;
  name: string;
  description?: string; // Brief description of the theme
  type: 'solid' | 'gradient' | 'pattern';
  mode: 'light' | 'dark';
  colors: {
    background: string;
    text: string;
    muted?: string; // Secondary/muted text color
    icon: string;
    accent?: string; // Primary accent color (defaults to icon if not set)
    border: string;
    surface: string; // for cards/panels
    dropdown?: string; // for dropdowns/overlays that need solid backgrounds
  };
  patternImage?: string; // URL for pattern image
  backgroundSize?: string; // Optional background size property
}