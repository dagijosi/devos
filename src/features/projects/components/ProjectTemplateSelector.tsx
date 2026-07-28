import { useState } from 'react';
import { FaNodeJs, FaReact, FaPython, FaDocker, FaVuejs, FaAngular, FaPhp, FaJava, FaRust, FaDatabase, FaBox, FaCog } from 'react-icons/fa';
import { SiNextdotjs, SiTypescript, SiTailwindcss, SiExpress, SiFastapi, SiGo, SiRuby, SiFlutter, SiDotnet, SiLaravel, SiDjango } from 'react-icons/si';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  technology: string[];
  scripts: Record<string, string>;
  envVars?: Record<string, string>;
}

const TEMPLATES: Template[] = [
  {
    id: 'react-ts', name: 'React + TypeScript', description: 'Vite + React 18 + TypeScript + Tailwind',
    icon: FaReact, color: '#61DAFB', technology: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'],
    scripts: { dev: 'npm run dev', build: 'npm run build', preview: 'npm run preview' },
  },
  {
    id: 'nextjs', name: 'Next.js', description: 'Next.js 14 + TypeScript + Tailwind CSS',
    icon: SiNextdotjs, color: '#000000', technology: ['Next.js', 'TypeScript', 'React', 'Tailwind CSS'],
    scripts: { dev: 'npm run dev', build: 'npm run build', start: 'npm start' },
  },
  {
    id: 'node-express', name: 'Node Express', description: 'Express.js + TypeScript API server',
    icon: SiExpress, color: '#68A063', technology: ['Node.js', 'Express', 'TypeScript'],
    scripts: { dev: 'npm run dev', build: 'npm run build', start: 'npm start' },
  },
  {
    id: 'python-fastapi', name: 'FastAPI', description: 'FastAPI + Python + Uvicorn',
    icon: SiFastapi, color: '#009688', technology: ['Python', 'FastAPI', 'Uvicorn'],
    scripts: { dev: 'uvicorn main:app --reload', start: 'uvicorn main:app' },
  },
  {
    id: 'python-django', name: 'Django', description: 'Django + Python web framework',
    icon: SiDjango, color: '#092E20', technology: ['Python', 'Django'],
    scripts: { dev: 'python manage.py runserver', migrate: 'python manage.py migrate', test: 'python manage.py test' },
  },
  {
    id: 'vue', name: 'Vue.js', description: 'Vue 3 + Vite + TypeScript',
    icon: FaVuejs, color: '#4FC08D', technology: ['Vue.js', 'TypeScript', 'Vite'],
    scripts: { dev: 'npm run dev', build: 'npm run build', preview: 'npm run preview' },
  },
  {
    id: 'rust', name: 'Rust', description: 'Rust + Cargo binary project',
    icon: FaRust, color: '#DEA584', technology: ['Rust', 'Cargo'],
    scripts: { dev: 'cargo run', build: 'cargo build', test: 'cargo test' },
  },
  {
    id: 'go', name: 'Go', description: 'Go module with standard layout',
    icon: SiGo, color: '#00ADD8', technology: ['Go'],
    scripts: { dev: 'go run .', build: 'go build', test: 'go test ./...' },
  },
  {
    id: 'dotnet', name: '.NET', description: 'ASP.NET Core Web API',
    icon: SiDotnet, color: '#512BD4', technology: ['C#', '.NET', 'ASP.NET'],
    scripts: { dev: 'dotnet run', build: 'dotnet build', test: 'dotnet test' },
  },
  {
    id: 'laravel', name: 'Laravel', description: 'Laravel PHP framework',
    icon: SiLaravel, color: '#FF2D20', technology: ['PHP', 'Laravel'],
    scripts: { dev: 'php artisan serve', migrate: 'php artisan migrate', test: 'php artisan test' },
  },
  {
    id: 'flutter', name: 'Flutter', description: 'Flutter cross-platform app',
    icon: SiFlutter, color: '#02569B', technology: ['Dart', 'Flutter'],
    scripts: { dev: 'flutter run', build: 'flutter build', test: 'flutter test' },
  },
  {
    id: 'empty', name: 'Empty Project', description: 'Start from scratch with no preset',
    icon: FaBox, color: '#888', technology: [],
    scripts: {},
  },
];

interface Props {
  onSelect: (template: Template) => void;
  onClose: () => void;
}

export function ProjectTemplateSelector({ onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');

  const filtered = TEMPLATES.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-theme-surface border border-theme-border/20 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-theme-border/10">
          <h2 className="text-lg font-bold text-theme-text">New Project from Template</h2>
          <p className="text-xs text-theme-text/40 mt-1">Choose a template to pre-configure scripts and technologies</p>
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full mt-3 bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((template) => {
              const Icon = template.icon;
              return (
                <button
                  key={template.id}
                  onClick={() => onSelect(template)}
                  className="flex flex-col items-start gap-3 p-4 bg-theme-background/30 border border-theme-border/20 rounded-xl hover:border-theme-icon/40 hover:bg-theme-background/50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${template.color}15` }}>
                      <Icon className="w-5 h-5" style={{ color: template.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-theme-text truncate group-hover:text-theme-icon transition-colors">{template.name}</p>
                      <p className="text-[10px] text-theme-text/40 line-clamp-1">{template.description}</p>
                    </div>
                  </div>
                  {template.technology.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.technology.map((tech) => (
                        <span key={tech} className="px-1.5 py-0.5 text-[9px] font-medium bg-theme-background/50 text-theme-text/50 rounded border border-theme-border/10">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex justify-end px-5 py-3 border-t border-theme-border/10">
          <button onClick={onClose} className="px-4 py-2 text-xs text-theme-text/50 hover:text-theme-text transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}
