import type { IconType } from 'react-icons';

export type ToolCategory =
  | 'formatters'
  | 'generators'
  | 'encoders'
  | 'api'
  | 'database'
  | 'security'
  | 'network'
  | 'images'
  | 'text'
  | 'developer'
  | 'integrations';

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  integrations: 'Integrations',
  formatters: 'Formatters',
  generators: 'Generators',
  encoders: 'Encoders',
  api: 'API',
  database: 'Database',
  security: 'Security',
  network: 'Network',
  images: 'Images',
  text: 'Text',
  developer: 'Developer',
};

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  icon: IconType;
  category: ToolCategory;
  keywords: string[];
}
