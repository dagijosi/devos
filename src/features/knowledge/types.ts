export type KnowledgeType = 'note' | 'bug' | 'snippet' | 'prompt' | 'doc' | 'bookmark' | 'template';
export type ItemStatus = 'active' | 'archived' | 'trashed';

export interface KnowledgeItem {
  id: number;
  title: string;
  type: KnowledgeType;
  content: string;
  code: string;
  description: string;
  language: string;
  url: string;
  problem: string;
  cause: string;
  solution: string;
  severity: string;
  category: string;
  tags: string[];
  favorite: boolean;
  pinned: boolean;
  status: ItemStatus;
  project_id: number | null;
  folder_id: number | null;
  last_opened: string | null;
  created_at: string;
  updated_at: string;
}

export type KnowledgeFormData = {
  title: string;
  type: KnowledgeType;
  content?: string;
  description?: string;
  language?: string;
  url?: string;
  problem?: string;
  cause?: string;
  solution?: string;
  severity?: string;
  category?: string;
  tags?: string[];
  favorite?: boolean;
  pinned?: boolean;
  status?: ItemStatus;
  project_id?: number | null;
  folder_id?: number | null;
};

export interface Relation {
  id: number;
  source_id: number;
  target_id: number;
  relation_type: string;
  created_at: string;
}

export interface KnowledgeFolder {
  id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
}

export interface CreateMenuOption {
  type: KnowledgeType;
  label: string;
  icon: string;
  description: string;
}

export const KNOWLEDGE_TYPES: CreateMenuOption[] = [
  { type: 'note', label: 'Note', icon: '📄', description: 'Markdown note' },
  { type: 'bug', label: 'Bug', icon: '🐞', description: 'Track a bug' },
  { type: 'snippet', label: 'Snippet', icon: '💻', description: 'Code snippet' },
  { type: 'prompt', label: 'Prompt', icon: '🤖', description: 'AI prompt' },
  { type: 'doc', label: 'Doc', icon: '📚', description: 'Documentation' },
  { type: 'bookmark', label: 'Bookmark', icon: '🔖', description: 'Save a link' },
  { type: 'template', label: 'Template', icon: '📋', description: 'Reusable doc' },
];

export const SNIPPET_LANGUAGES = [
  { id: 'typescript', label: 'TypeScript', icon: '📘' },
  { id: 'javascript', label: 'JavaScript', icon: '📒' },
  { id: 'react', label: 'React', icon: '⚛️' },
  { id: 'node', label: 'Node.js', icon: '🟢' },
  { id: 'python', label: 'Python', icon: '🐍' },
  { id: 'rust', label: 'Rust', icon: '🦀' },
  { id: 'go', label: 'Go', icon: '🔵' },
  { id: 'sql', label: 'SQL', icon: '🗃️' },
  { id: 'shell', label: 'Shell', icon: '⌨️' },
  { id: 'flutter', label: 'Flutter', icon: '🦋' },
  { id: 'laravel', label: 'Laravel', icon: '🎯' },
  { id: 'html', label: 'HTML', icon: '🌐' },
  { id: 'css', label: 'CSS', icon: '🎨' },
  { id: 'json', label: 'JSON', icon: '📋' },
  { id: 'yaml', label: 'YAML', icon: '📄' },
  { id: 'docker', label: 'Docker', icon: '🐳' },
  { id: 'markdown', label: 'Markdown', icon: '📝' },
];

// Keep old types for backward compat until full migration
export type Note = KnowledgeItem;
export type CodeSnippet = KnowledgeItem;
export type Bug = KnowledgeItem;
export type Folder = KnowledgeFolder;
export interface NoteFormData { title: string; content?: string; folder_id?: number | null; tags?: string[]; project_id?: number | null; }
export interface CodeSnippetFormData { title: string; code: string; language: string; description?: string; tags?: string[]; project_id?: number | null; }
export interface BugFormData { title: string; problem: string; solution?: string; tags?: string[]; project_id?: number | null; status?: string; }
export interface Attachment { id: number; note_id: number; name: string; file_path: string; file_size: number | null; mime_type: string; created_at: string; }
