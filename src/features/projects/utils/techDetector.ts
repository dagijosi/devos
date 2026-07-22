import type { DetectedConfig, DetectedTechnology } from '../types';

interface DetectionRule {
  file: string;
  detect: (content: string, path: string) => DetectedConfig | null;
}

function parseJsonFile(content: string): Record<string, unknown> | null {
  try { return JSON.parse(content); } catch { return null; }
}

function parsePackageJson(content: string, path: string): DetectedConfig {
  const data = parseJsonFile(content);
  const technologies: DetectedTechnology[] = [];
  const scripts: Record<string, string> = {};

  if (data) {
    const deps = { ...(data.dependencies as Record<string, string> || {}), ...(data.devDependencies as Record<string, string> || {}) };
    const techMap: Record<string, string> = {
      react: 'React', vue: 'Vue.js', angular: 'Angular', svelte: 'Svelte',
      next: 'Next.js', nuxt: 'Nuxt.js', gatsby: 'Gatsby', 'remix': 'Remix',
      express: 'Express.js', nest: 'NestJS', fastify: 'Fastify',
      '@nestjs/core': 'NestJS', electron: 'Electron', tauri: 'Tauri',
      tailwindcss: 'Tailwind CSS', typescript: 'TypeScript',
      prisma: 'Prisma', drizzle: 'Drizzle ORM',
      vitest: 'Vitest', jest: 'Jest',
    };
    for (const [pkg, label] of Object.entries(techMap)) {
      if (deps[pkg]) {
        const ver = deps[pkg].replace(/^[\^~]/, '');
        technologies.push({ name: label, version: ver, icon: label.toLowerCase().replace(/\s+/g, '-') });
      }
    }
    if ((data as { scripts?: Record<string, string> }).scripts) {
      Object.assign(scripts, (data as { scripts: Record<string, string> }).scripts);
    }
  }

  return { path, type: 'package.json', technologies, scripts };
}

function parseCargoToml(content: string, path: string): DetectedConfig {
  const techs: DetectedTechnology[] = [{ name: 'Rust', icon: 'rust' }];
  if (/tauri/i.test(content)) techs.push({ name: 'Tauri', icon: 'tauri' });
  return { path, type: 'Cargo.toml', technologies: techs };
}

function detectDockerfile(_content: string, path: string): DetectedConfig {
  const techs: DetectedTechnology[] = [{ name: 'Docker', icon: 'docker' }];
  return { path, type: 'Dockerfile', technologies: techs };
}

const RULES: DetectionRule[] = [
  {
    file: 'package.json',
    detect: (content, path) => {
      const config = parsePackageJson(content, path);
      if (config.technologies.length === 0) {
        config.technologies.push({ name: 'Node.js', icon: 'nodejs' });
      }
      return config;
    },
  },
  {
    file: 'pubspec.yaml',
    detect: (_content, path) => ({
      path, type: 'pubspec.yaml',
      technologies: [{ name: 'Flutter', icon: 'flutter' }, { name: 'Dart', icon: 'dart' }],
    }),
  },
  {
    file: 'composer.json',
    detect: (content, path) => {
      const data = parseJsonFile(content);
      const techs: DetectedTechnology[] = [{ name: 'PHP', icon: 'php' }];
      if (data) {
        const deps = { ...(data.require as Record<string, string> || {}), ...(data['require-dev'] as Record<string, string> || {}) };
        if (deps.laravel) techs.push({ name: 'Laravel', icon: 'laravel' });
        if (deps.symfony) techs.push({ name: 'Symfony', icon: 'symfony' });
      }
      return { path, type: 'composer.json', technologies: techs };
    },
  },
  {
    file: 'Cargo.toml',
    detect: (content, path) => parseCargoToml(content, path),
  },
  {
    file: 'Dockerfile',
    detect: (content, path) => detectDockerfile(content, path),
  },
  {
    file: 'pom.xml',
    detect: (_content, path) => ({
      path, type: 'pom.xml',
      technologies: [{ name: 'Java', icon: 'java' }, { name: 'Maven', icon: 'maven' }],
    }),
  },
  {
    file: 'go.mod',
    detect: (_content, path) => ({
      path, type: 'go.mod',
      technologies: [{ name: 'Go', icon: 'go' }],
    }),
  },
  {
    file: 'requirements.txt',
    detect: (_content, path) => ({
      path, type: 'requirements.txt',
      technologies: [{ name: 'Python', icon: 'python' }],
    }),
  },
  {
    file: 'Gemfile',
    detect: (_content, path) => ({
      path, type: 'Gemfile',
      technologies: [{ name: 'Ruby', icon: 'ruby' }],
    }),
  },
  {
    file: '.csproj',
    detect: (content, path) => {
      const techs: DetectedTechnology[] = [{ name: 'C#', icon: 'csharp' }, { name: '.NET', icon: 'dotnet' }];
      if (/Blazor/i.test(content)) techs.push({ name: 'Blazor', icon: 'blazor' });
      return { path, type: '.csproj', technologies: techs };
    },
  },
];

export function getDetectableFiles(): string[] {
  return RULES.map((r) => r.file);
}

export function detectTechnologies(fileName: string, content: string, path: string): DetectedConfig | null {
  const rule = RULES.find((r) => r.file === fileName);
  if (!rule) return null;
  return rule.detect(content, path);
}

export function getTechnologyColor(name: string): string {
  const colors: Record<string, string> = {
    react: '#61dafb', vue: '#4fc08d', angular: '#dd0031', svelte: '#ff3e00',
    'next.js': '#000000', 'vue.js': '#4fc08d', 'tailwind css': '#06b6d4',
    typescript: '#3178c6', javascript: '#f7df1e', rust: '#dea584',
    tauri: '#ffc131', flutter: '#02569b', dart: '#0175c2',
    python: '#3776ab', go: '#00add8', php: '#777bb4',
    laravel: '#ff2d20', symfony: '#000000', java: '#007396',
    docker: '#2496ed', 'c#': '#239120', '.net': '#512bd4',
    nodejs: '#339933', ruby: '#cc342d', electron: '#47848f',
    prisma: '#2d3748', jest: '#c21325',
  };
  return colors[name.toLowerCase()] || '#6366f1';
}
