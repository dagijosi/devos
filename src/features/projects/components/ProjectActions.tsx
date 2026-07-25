import { FaFolder, FaCode, FaTerminal, FaPlayCircle, FaExternalLinkAlt } from 'react-icons/fa';
import { openFolder, openVSCode, openTerminal, runScript, openBrowser } from '../utils/projectActions';
import type { Project } from '../types';

interface Props {
  project: Project;
  onOpen: (id: number) => void;
}

export function ProjectActions({ project, onOpen }: Props) {
  const actions = [
    { label: 'Open Folder', icon: FaFolder, action: () => project.local_path && openFolder(project.local_path), disabled: !project.local_path },
    { label: 'VS Code', icon: FaCode, action: () => project.local_path && openVSCode(project.local_path), disabled: !project.local_path },
    { label: 'Terminal', icon: FaTerminal, action: () => project.local_path && openTerminal(project.local_path), disabled: !project.local_path },
    { label: 'Repository', icon: FaExternalLinkAlt, action: () => project.repository_url && openBrowser(project.repository_url), disabled: !project.repository_url },
    ...Object.entries(typeof project.scripts === 'string' ? (() => { try { return JSON.parse(project.scripts); } catch { return {}; } })() : project.scripts || {}).slice(0, 3).map(([name, cmd]) => ({
      label: `Run: ${name}`,
      icon: FaPlayCircle,
      action: () => runScript(cmd as string, project.local_path || undefined),
      disabled: false,
    })),
  ];

  return (
    <div className="grid grid-cols-5 gap-2">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.label}
            onClick={() => { a.action(); onOpen(project.id); }}
            disabled={a.disabled}
            title={a.label}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
              a.disabled
                ? 'border-theme-border/10 text-theme-text/20 cursor-not-allowed'
                : 'border-theme-border/20 text-theme-text/60 hover:border-theme-border/40 hover:text-theme-text hover:bg-theme-background/50 cursor-pointer'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[10px] font-medium">{a.label}</span>
          </button>
        );
      })}
    </div>
  );
}
