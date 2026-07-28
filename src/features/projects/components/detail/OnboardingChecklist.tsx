import { useEffect, useState } from 'react';
import { FaCheckCircle, FaCircle, FaFolder, FaGitAlt, FaCog, FaPlay, FaGithub } from 'react-icons/fa';
import type { Project } from '../../types';

interface Props {
  project: Project;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  done: boolean;
  action?: () => void;
}

export function OnboardingChecklist({ project }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    const check: ChecklistItem[] = [
      {
        id: 'path', label: 'Local path linked',
        description: project.local_path ? project.local_path : 'Set a local folder for this project',
        icon: FaFolder, done: !!project.local_path,
      },
      {
        id: 'git', label: 'Git detected',
        description: 'Version control initialized',
        icon: FaGitAlt, done: false,
      },
      {
        id: 'env', label: 'Environment configured',
        description: Object.keys(project.environment || {}).length > 0 ? `${Object.keys(project.environment).length} variables set` : 'Add environment variables',
        icon: FaCog, done: Object.keys(project.environment || {}).length > 0,
      },
      {
        id: 'scripts', label: 'Run configs added',
        description: 'Dev/build scripts configured',
        icon: FaPlay, done: false,
      },
      {
        id: 'repo', label: 'Repository linked',
        description: project.repository_url ? project.repository_url : 'Link a remote repository',
        icon: FaGithub, done: !!project.repository_url,
      },
    ];

    // Check git
    if (project.local_path) {
      (async () => {
        try {
          const { isTauri } = await import('../../../../lib/tauri');
          if (isTauri()) {
            const { Command } = await import('@tauri-apps/plugin-shell');
            const cmd = Command.create('git', ['rev-parse', '--git-dir'], { cwd: project.local_path });
            const result = await cmd.execute();
            if (result.code === 0) {
              check[1].done = true;
              check[1].description = 'Git repository detected';
            }
          }
        } catch {}
        setItems([...check]);
      })();
    }

    // Check scripts
    (async () => {
      try {
        const scripts = await (await import('../../../../database')).database.getProjectScripts(project.id);
        check[3].done = scripts.length > 0;
        check[3].description = scripts.length > 0 ? `${scripts.length} config${scripts.length > 1 ? 's' : ''}` : 'Add run configs';
      } catch {}
      setItems([...check]);
    })();
  }, [project]);

  const doneCount = items.filter(i => i.done).length;
  if (doneCount === items.length) return null;

  return (
    <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-theme-text flex items-center gap-2">
          Project Setup {doneCount}/{items.length}
        </h3>
        <div className="h-1.5 flex-1 max-w-[120px] bg-theme-background/50 rounded-full overflow-hidden ml-3">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${(doneCount / items.length) * 100}%` }} />
        </div>
      </div>
      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${item.done ? 'opacity-50' : 'bg-theme-background/30'}`}>
            {item.done ? <FaCheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" /> : <FaCircle className="w-3.5 h-3.5 text-theme-text/20 shrink-0" />}
            <item.icon className="w-3 h-3 text-theme-text/40 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className={`font-medium ${item.done ? 'text-theme-text/40 line-through' : 'text-theme-text'}`}>{item.label}</span>
              <span className="text-theme-text/40 ml-1.5 truncate">{item.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
