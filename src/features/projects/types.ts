export interface Project {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'archived' | 'completed';
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
}

export interface ProjectFormData {
  name: string;
  description: string;
  tags: string[];
  technology: string[];
  repository_url: string;
  local_path: string;
  status: 'active' | 'archived' | 'completed';
  scripts?: Record<string, string>;
  environment?: Record<string, string>;
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
