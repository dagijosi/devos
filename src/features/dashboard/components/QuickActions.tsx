import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFolder, FaStickyNote, FaPlay, FaTerminal, FaRocket, FaSearch, FaListCheck, FaCode, FaPlus } from 'react-icons/fa';
import { PROJECTS, KNOWLEDGE, WORKFLOWS, TASKS } from '../../../routes/types/routeConstants';
import { useAppStore } from '../../../stores/app.store';
import { useActiveProjectStore } from '../../../stores/activeProject.store';
import { QuickCapture } from '../../quick-capture/QuickCapture';

export function QuickActions() {
  const navigate = useNavigate();
  const toggleCommandPalette = useAppStore(s => s.toggleCommandPalette);
  const activeProject = useActiveProjectStore(s => s.activeProject);
  const [captureOpen, setCaptureOpen] = useState(false);

  const actions = [
    { label: 'New Project', icon: FaFolder, desc: 'Create a new project', route: `${PROJECTS}?new=true` },
    { label: 'Quick Capture', icon: FaPlus, desc: 'Task, note, bug, or snippet', action: 'capture' as const },
    { label: 'Tasks', icon: FaListCheck, desc: 'Today\'s priorities', route: TASKS },
    { label: 'New Note', icon: FaStickyNote, desc: 'Quick note capture', route: KNOWLEDGE },
    { label: 'Run Workflow', icon: FaPlay, desc: 'Execute workflows', route: WORKFLOWS },
    { label: 'Search', icon: FaSearch, desc: 'Ctrl+K', action: 'search' as const },
  ];

  if (activeProject) {
    actions.splice(1, 0, {
      label: 'Open Terminal', icon: FaTerminal, desc: activeProject.name,
      action: 'terminal' as const,
    });
    actions.splice(2, 0, {
      label: 'Open in VS Code', icon: FaCode, desc: activeProject.localPath,
      action: 'vscode' as const,
    });
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map(a => {
          const Icon = a.icon;
          return (
            <button key={a.label} onClick={() => {
              if (a.action === 'capture') setCaptureOpen(true);
              else if (a.action === 'search') toggleCommandPalette();
              else if (a.action === 'terminal') navigate(`/terminal?cwd=${encodeURIComponent(activeProject?.localPath || '')}`);
              else if (a.action === 'vscode') {
                if (activeProject?.localPath) {
                  import('@tauri-apps/api/core').then(({ invoke }) => invoke('open_vscode', { path: activeProject.localPath }).catch(() => {}));
                }
              }
              else if (a.route) navigate(a.route);
            }}
              className="group flex flex-col items-start gap-2 p-4 bg-theme-background/30 border border-theme-border/10 hover:border-theme-border/30 rounded-xl transition-all text-left hover:bg-theme-background/50"
            >
              <div className="w-9 h-9 rounded-lg bg-theme-icon/10 flex items-center justify-center group-hover:bg-theme-icon/20 transition-colors">
                <Icon className="w-4 h-4 text-theme-icon" />
              </div>
              <div>
                <p className="text-sm font-medium text-theme-text">{a.label}</p>
                <p className="text-[10px] text-theme-text/40 truncate max-w-full">{a.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
      {captureOpen && <QuickCapture onClose={() => setCaptureOpen(false)} onCreated={() => setCaptureOpen(false)} />}
    </>
  );
}
