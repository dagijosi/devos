export interface Project {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'archived' | 'completed';
  icon: string;
  color: string;
  category: string;
  tags: string[];
  technology: string[];
  favorite: boolean;
  pinned: boolean;
  repository_url: string;
  local_path: string;
  scripts: Record<string, string>;
  environment: Record<string, string>;
  last_opened: string | null;
  created_at: string;
  updated_at: string;
  note_count?: number;
  task_count?: number;
  bug_count?: number;
  snippet_count?: number;
}

export interface ProjectFormData {
  name: string;
  description: string;
  status: 'active' | 'archived' | 'completed';
  icon: string;
  color: string;
  category: string;
  tags: string[];
  technology: string[];
  repository_url: string;
  local_path: string;
  scripts: Record<string, string>;
  environment: Record<string, string>;
}

export interface ProjectPath {
  id: number;
  project_id: number;
  path: string;
  type: string;
}

export interface ProjectScript {
  id: number;
  project_id: number;
  name: string;
  command: string;
}

export interface ProjectLink {
  id: number;
  project_id: number;
  type: string;
  url: string;
}

export interface ProjectActivity {
  id: number;
  project_id: number;
  title: string;
  type: string;
  created_at: string;
}

export interface ProjectTask {
  id: number;
  project_id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  due_date: string | null;
  created_at: string;
}

export interface Deployment {
  id: number;
  project_id: number;
  name: string;
  provider: string;
  url: string;
  build_command: string;
  branch: string;
  auto_deploy: number;
  status: string;
  last_deployed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeploymentLog {
  id: number;
  deployment_id: number;
  status: string;
  output: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface DetectedTechnology {
  name: string;
  version?: string;
  icon: string;
}

export interface DetectedConfig {
  path: string;
  type: 'package.json' | 'pubspec.yaml' | 'composer.json' | 'Cargo.toml' | 'Dockerfile' | 'pom.xml' | 'go.mod' | 'requirements.txt' | 'Gemfile' | '.csproj';
  technologies: DetectedTechnology[];
  scripts?: Record<string, string>;
}
