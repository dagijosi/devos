export interface Theme {
  id: string;
  name: string;
  description?: string;
  type: 'solid' | 'gradient' | 'pattern';
  mode: 'light' | 'dark';
  colors: {
    background: string;
    text: string;
    textSecondary?: string;
    muted?: string;
    icon: string;
    accent?: string;
    border: string;
    surface: string;
    dropdown?: string;
    hover?: string;
    success?: string;
    warning?: string;
    error?: string;
    info?: string;
    secondary?: string;
  };
  patternImage?: string;
  backgroundSize?: string;
}
