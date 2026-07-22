export interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
  icon: string;
  created_at: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  folder_id: number | null;
  tags: string[];
  favorite: boolean;
  pinned: boolean;
  project_id: number | null;
  last_opened: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteFormData {
  title: string;
  content: string;
  folder_id?: number | null;
  tags?: string[];
  project_id?: number | null;
}

export interface CodeSnippet {
  id: number;
  title: string;
  code: string;
  language: string;
  description: string;
  tags: string[];
  favorite: boolean;
  project_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface CodeSnippetFormData {
  title: string;
  code: string;
  language: string;
  description?: string;
  tags?: string[];
  project_id?: number | null;
}

export interface Bug {
  id: number;
  title: string;
  problem: string;
  solution: string;
  tags: string[];
  project_id: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BugFormData {
  title: string;
  problem: string;
  solution?: string;
  tags?: string[];
  project_id?: number | null;
  status?: string;
}

export interface Attachment {
  id: number;
  note_id: number;
  name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string;
  created_at: string;
}

export const SNIPPET_LANGUAGES = [
  { id: 'react', label: 'React', icon: '⚛️' },
  { id: 'node', label: 'Node.js', icon: '🟢' },
  { id: 'flutter', label: 'Flutter', icon: '🦋' },
  { id: 'laravel', label: 'Laravel', icon: '🎯' },
  { id: 'sql', label: 'SQL', icon: '🗃️' },
  { id: 'prompt', label: 'Prompt', icon: '💬' },
  { id: 'shell', label: 'Shell', icon: '⌨️' },
  { id: 'typescript', label: 'TypeScript', icon: '📘' },
  { id: 'javascript', label: 'JavaScript', icon: '📒' },
  { id: 'python', label: 'Python', icon: '🐍' },
  { id: 'rust', label: 'Rust', icon: '🦀' },
  { id: 'go', label: 'Go', icon: '🔵' },
  { id: 'html', label: 'HTML', icon: '🌐' },
  { id: 'css', label: 'CSS', icon: '🎨' },
  { id: 'json', label: 'JSON', icon: '📋' },
  { id: 'yaml', label: 'YAML', icon: '📄' },
  { id: 'markdown', label: 'Markdown', icon: '📝' },
  { id: 'docker', label: 'Docker', icon: '🐳' },
];

export const NOTE_LANGUAGES = ['markdown', 'text', 'plain'] as const;
