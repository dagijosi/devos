import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFolder, FaCode, FaTerminal, FaExternalLinkAlt, FaCheck, FaTimes } from 'react-icons/fa';
import { useActiveProjectStore } from '../../../stores/activeProject.store';
import { openVSCode } from '../utils/projectActions';
import { useProjects } from '../hooks/useProjects';
import { PROJECT_DETAIL, PROJECTS, TERMINAL } from '../../../routes/types/routeConstants';
import { setProjectContext } from '../utils/projectContext';

export function ProjectSwitcher() {
  const navigate = useNavigate();
  const { activeProject, setActiveProject, recentProjects } = useActiveProjectStore();
  const { projects = [] } = useProjects();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = projects.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.local_path?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (project: { id: number; name: string; local_path?: string }) => {
    setActiveProject({ id: project.id, name: project.name, localPath: project.local_path || '' });
    setProjectContext(project);
    setOpen(false);
    setSearch('');
    navigate(PROJECT_DETAIL.replace(':id', String(project.id)));
  };

  const handleOpenTerminal = (e: React.MouseEvent, project: { id: number; name: string; local_path?: string }) => {
    e.stopPropagation();
    setActiveProject({ id: project.id, name: project.name, localPath: project.local_path || '' });
    setProjectContext(project);
    navigate(`${TERMINAL}?cwd=${encodeURIComponent(project.local_path || '')}&label=${encodeURIComponent(project.name)}`);
    setOpen(false);
  };

  const handleOpenVsCode = (e: React.MouseEvent, localPath?: string) => {
    e.stopPropagation();
    if (localPath) {
      openVSCode(localPath).catch(() => {
        window.open(`vscode://file/${encodeURIComponent(localPath)}`);
      });
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
          activeProject
            ? 'bg-theme-icon/10 text-theme-icon border border-theme-icon/20 hover:bg-theme-icon/20'
            : 'bg-theme-surface/30 text-theme-text/50 border border-theme-border/10 hover:bg-theme-surface/50 hover:text-theme-text/70'
        }`}
        title={activeProject ? `Active: ${activeProject.name}` : 'Select active project'}
      >
        <FaFolder className="w-3.5 h-3.5" />
        <span className="max-w-[120px] truncate">{activeProject ? activeProject.name : 'No project'}</span>
        <svg className="w-3 h-3 text-theme-text/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-theme-surface border border-theme-border/20 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-2">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-theme-background/50 border border-theme-border/20 rounded-lg px-3 py-1.5 text-xs text-theme-text placeholder:text-theme-text/30 outline-none focus:border-theme-icon/40"
            />
          </div>

          {recentProjects.length > 0 && !search && (
            <div className="px-3 py-1.5 text-[10px] font-medium text-theme-text/30 uppercase tracking-wider">Recent</div>
          )}
          {!search &&
            recentProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelect(p)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-theme-background/30 transition-colors ${
                  activeProject?.id === p.id ? 'bg-theme-icon/5 text-theme-icon' : 'text-theme-text/70'
                }`}
              >
                <div className="w-6 h-6 rounded-md bg-theme-icon/10 flex items-center justify-center shrink-0">
                  <FaFolder className="w-3 h-3 text-theme-icon/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  {p.localPath && <div className="text-[10px] text-theme-text/30 truncate">{p.localPath}</div>}
                </div>
                {activeProject?.id === p.id && <FaCheck className="w-3 h-3 text-green-500 shrink-0" />}
              </button>
            ))}

          {search && (
            <div className="px-3 py-1.5 text-[10px] font-medium text-theme-text/30 uppercase tracking-wider">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </div>
          )}
          {(search ? filtered : projects.filter((p) => !recentProjects.some((r) => r.id === p.id))).slice(0, 8).map((p) => (
            <div key={p.id} className="group flex items-center">
              <button
                onClick={() => handleSelect(p)}
                className={`flex-1 flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-theme-background/30 transition-colors ${
                  activeProject?.id === p.id ? 'bg-theme-icon/5 text-theme-icon' : 'text-theme-text/70'
                }`}
              >
                <div className="w-6 h-6 rounded-md bg-theme-icon/10 flex items-center justify-center shrink-0">
                  <FaFolder className="w-3 h-3 text-theme-icon/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  {p.local_path && <div className="text-[10px] text-theme-text/30 truncate">{p.local_path}</div>}
                </div>
                {activeProject?.id === p.id && <FaCheck className="w-3 h-3 text-green-500 shrink-0" />}
              </button>
              <div className="hidden group-hover:flex items-center gap-1 pr-2">
                <button onClick={(e) => handleOpenTerminal(e, p)} className="p-1 rounded hover:bg-theme-background/30 text-theme-text/40 hover:text-theme-icon" title="Open Terminal">
                  <FaTerminal className="w-3 h-3" />
                </button>
                <button onClick={(e) => handleOpenVsCode(e, p.local_path)} className="p-1 rounded hover:bg-theme-background/30 text-theme-text/40 hover:text-theme-icon" title="Open in VS Code">
                  <FaCode className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}

          <div className="border-t border-theme-border/10 p-2">
            <button
              onClick={() => { navigate(PROJECTS); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-theme-text/50 hover:text-theme-text hover:bg-theme-background/30 rounded-lg transition-colors"
            >
              <FaFolder className="w-3 h-3" />
              Browse all projects
              <FaExternalLinkAlt className="w-2.5 h-2.5 ml-auto" />
            </button>
          </div>

          {activeProject && (
            <div className="border-t border-theme-border/10 p-2">
              <button
                onClick={() => { setActiveProject(null); setProjectContext(null); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <FaTimes className="w-3 h-3" />
                Clear active project
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
