import { IconType } from 'react-icons';

export type ToolCategory = 'development' | 'conversion' | 'security' | 'generation' | 'formatting';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  icon: IconType;
  category: ToolCategory;
  shortcut?: string;
  keywords: string[];
}
