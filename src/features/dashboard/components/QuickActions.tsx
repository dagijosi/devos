import { useNavigate } from 'react-router-dom';
import { FaFolder, FaStickyNote, FaCode, FaPlay, FaTerminal, FaRocket, FaSearch } from 'react-icons/fa';
import { invoke } from '@tauri-apps/api/core';
import { PROJECTS, KNOWLEDGE, UTILITIES, WORKFLOWS } from '../../../routes/types/routeConstants';
import { useAppStore } from '../../../stores/app.store';

const actions = [
  { label: 'New Project', icon: FaFolder, desc: 'Create a new project', route: `${PROJECTS}?new=true` },
  { label: 'New Note', icon: FaStickyNote, desc: 'Quick note capture', route: KNOWLEDGE },
  { label: 'Run Workflow', icon: FaPlay, desc: 'Execute workflows', route: WORKFLOWS },
  { label: 'Open Terminal', icon: FaTerminal, desc: 'Command line', action: 'terminal' },
  { label: 'Start Dev', icon: FaRocket, desc: 'Launch dev server', route: UTILITIES },
  { label: 'Search Everything', icon: FaSearch, desc: 'Ctrl + K', action: 'search' },
];

export function QuickActions() {
  const navigate = useNavigate();
  const toggleCommandPalette = useAppStore(s => s.toggleCommandPalette);

  const handleAction = async (a: typeof actions[number]) => {
    if ('route' in a && a.route) navigate(a.route);
    else if (a.action === 'terminal') {
      try { await invoke('open_terminal'); } catch { /* noop */ }
    } else if (a.action === 'search') toggleCommandPalette();
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {actions.map(a => {
        const Icon = a.icon;
        return (
          <button key={a.label} onClick={() => handleAction(a)}
            className="group flex flex-col items-start gap-2 p-4 bg-theme-background/30 border border-theme-border/10 hover:border-theme-border/30 rounded-xl transition-all text-left hover:bg-theme-background/50"
          >
            <div className="w-9 h-9 rounded-lg bg-theme-icon/10 flex items-center justify-center group-hover:bg-theme-icon/20 transition-colors">
              <Icon className="w-4 h-4 text-theme-icon" />
            </div>
            <div>
              <p className="text-sm font-medium text-theme-text">{a.label}</p>
              <p className="text-[10px] text-theme-text/40">{a.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
