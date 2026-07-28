import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFolder, FaStickyNote, FaBug, FaCode, FaTerminal, FaKey, FaCube, FaGitAlt, FaPlus, FaTimes, FaArrowRight, FaSearch, FaPlay, FaCloudUploadAlt, FaArrowDown } from 'react-icons/fa';
import { useAppStore } from '../../stores/app.store';
import { database } from '../../database';
import { PROJECT_DETAIL, PROJECTS, KNOWLEDGE, TASKS, TERMINAL } from '../../routes/types/routeConstants';
import { getProjectContext } from '../projects/utils/projectContext';
import { runScript as runProjectScript, openVSCode } from '../projects/utils/projectActions';

interface SearchResult {
  id: string;
  type: 'project' | 'task' | 'note' | 'bug' | 'snippet' | 'action';
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
}

const COMMANDS: SearchResult[] = [
  { id: 'cmd-new-project', type: 'action', label: 'Create Project', description: 'Start a new project', icon: FaPlus, action: () => {} },
  { id: 'cmd-add-task', type: 'action', label: 'Add Task', description: 'Quick capture a task', icon: FaPlus, action: () => {} },
  { id: 'cmd-open-terminal', type: 'action', label: 'Open Terminal', description: 'Open a terminal session', icon: FaTerminal, action: () => {} },
  { id: 'cmd-switch-project', type: 'action', label: 'Switch Project', description: 'Change active project', icon: FaFolder, action: () => {} },
  { id: 'cmd-run-dev', type: 'action', label: 'Run Dev', description: 'Run the active project\'s dev command', icon: FaPlay, action: () => {} },
  { id: 'cmd-commit', type: 'action', label: 'Commit Changes', description: 'Stage and commit git changes', icon: FaGitAlt, action: () => {} },
  { id: 'cmd-push', type: 'action', label: 'Git Push', description: 'Push commits to remote', icon: FaArrowRight, action: () => {} },
  { id: 'cmd-pull', type: 'action', label: 'Git Pull', description: 'Pull latest changes from remote', icon: FaArrowDown, action: () => {} },
  { id: 'cmd-deploy', type: 'action', label: 'Deploy Project', description: 'Deploy the active project', icon: FaCloudUploadAlt, action: () => {} },
  { id: 'cmd-open-vscode', type: 'action', label: 'Open in VS Code', description: 'Open project in Visual Studio Code', icon: FaCode, action: () => {} },
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  project: FaFolder,
  task: FaStickyNote,
  note: FaStickyNote,
  bug: FaBug,
  snippet: FaCode,
  action: FaArrowRight,
};

const TYPE_COLORS: Record<string, string> = {
  project: 'text-blue-400 bg-blue-500/10',
  task: 'text-green-400 bg-green-500/10',
  note: 'text-green-400 bg-green-500/10',
  bug: 'text-red-400 bg-red-500/10',
  snippet: 'text-purple-400 bg-purple-500/10',
  action: 'text-theme-icon bg-theme-icon/10',
};

export function UnifiedSearch() {
  const navigate = useNavigate();
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      // Show default commands
      setResults([
        ...COMMANDS,
        { id: 'sep', type: 'action', label: '', icon: FaSearch, action: () => {} },
      ].filter((r) => r.label));
      return;
    }

    const terms = q.toLowerCase();
    const found: SearchResult[] = [];

    // Search projects
    try {
      const projects: any[] = await database.getProjects();
      projects.filter((p) => p.name.toLowerCase().includes(terms) || p.local_path?.toLowerCase().includes(terms)).slice(0, 3).forEach((p) => {
        found.push({
          id: `proj-${p.id}`, type: 'project', label: p.name,
          description: p.local_path || p.description,
          icon: FaFolder,
          action: () => navigate(PROJECT_DETAIL.replace(':id', String(p.id))),
        });
      });
    } catch {}

    // Search tasks
    try {
      const tasks: any[] = await database.getAllProjectTasks();
      tasks.filter((t) => t.title?.toLowerCase().includes(terms)).slice(0, 3).forEach((t) => {
        found.push({
          id: `task-${t.id}`, type: 'task', label: t.title,
          description: t.project_name || `Priority: ${t.priority}`,
          icon: FaStickyNote,
          action: () => navigate(TASKS),
        });
      });
    } catch {}

    // Search knowledge
    try {
      const notes: any[] = await database.getNotes();
      notes.filter((n) => n.title?.toLowerCase().includes(terms)).slice(0, 3).forEach((n) => {
        found.push({
          id: `note-${n.id}`, type: 'note', label: n.title, description: 'Note',
          icon: FaStickyNote,
          action: () => navigate(KNOWLEDGE),
        });
      });
    } catch {}

    // Search bugs
    try {
      const bugs: any[] = await database.getBugs();
      bugs.filter((b) => b.title?.toLowerCase().includes(terms)).slice(0, 2).forEach((b) => {
        found.push({
          id: `bug-${b.id}`, type: 'bug', label: b.title, description: b.status,
          icon: FaBug,
          action: () => navigate(KNOWLEDGE),
        });
      });
    } catch {}

    // Commands match
    COMMANDS.filter((c) => c.label.toLowerCase().includes(terms)).forEach((c) => found.push(c));

    setResults(found);
    setSelectedIndex(0);
  }, [navigate]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => doSearch(query), 200);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [query, doSearch]);

  const handleSelect = (result: SearchResult) => {
    if (result.id === 'cmd-new-project') navigate(`${PROJECTS}?new=true`);
    else if (result.id === 'cmd-add-task') navigate(TASKS);
    else if (result.id === 'cmd-open-terminal') navigate(TERMINAL);
    else if (result.id === 'cmd-switch-project') navigate(PROJECTS);
    else if (result.id === 'cmd-run-dev') {
      const ctx = getProjectContext();
      if (ctx?.localPath) try { runProjectScript('npm run dev', ctx.localPath); } catch {}
      else navigate(PROJECTS);
    }
    else if (result.id === 'cmd-commit') {
      const ctx = getProjectContext();
      if (ctx?.localPath) navigate(`/projects/${ctx.id}?tab=git`);
      else navigate(PROJECTS);
    }
    else if (result.id === 'cmd-push') {
      const ctx = getProjectContext();
      if (ctx?.localPath) navigate(`/projects/${ctx.id}?tab=git`);
      else navigate(PROJECTS);
    }
    else if (result.id === 'cmd-pull') {
      const ctx = getProjectContext();
      if (ctx?.localPath) navigate(`/projects/${ctx.id}?tab=git`);
      else navigate(PROJECTS);
    }
    else if (result.id === 'cmd-deploy') {
      const ctx = getProjectContext();
      if (ctx?.id) navigate(`/projects/${ctx.id}?tab=deployments`);
      else navigate(PROJECTS);
    }
    else if (result.id === 'cmd-open-vscode') {
      const ctx = getProjectContext();
      if (ctx?.localPath) { try { openVSCode(ctx.localPath); } catch {} }
      else navigate(PROJECTS);
    }
    else result.action();
    setCommandPaletteOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setCommandPaletteOpen(false); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); return; }
    if (e.key === 'Enter' && results[selectedIndex]) { handleSelect(results[selectedIndex]); return; }
  };

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]" onClick={() => setCommandPaletteOpen(false)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-theme-surface border border-theme-border/20 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-3 border-b border-theme-border/10">
          <FaSearch className="w-4 h-4 text-theme-text/40 shrink-0" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, tasks, notes, or run commands..."
            className="flex-1 bg-transparent text-sm text-theme-text placeholder:text-theme-text/30 outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] text-theme-text/30 bg-theme-background/50 rounded border border-theme-border/10">esc</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="text-center py-8">
              <FaSearch className="w-8 h-8 text-theme-text/10 mx-auto mb-2" />
              <p className="text-xs text-theme-text/30">{query ? 'No results found' : 'Start typing to search...'}</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {results.map((result, idx) => {
                if (!result.label) return <div key={result.id} className="border-t border-theme-border/5 my-1" />;
                const Icon = result.icon;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                      idx === selectedIndex ? 'bg-theme-background/30' : 'hover:bg-theme-background/20'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TYPE_COLORS[result.type] || 'bg-theme-background/30'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-theme-text truncate">{result.label}</p>
                      {result.description && <p className="text-[10px] text-theme-text/40 truncate">{result.description}</p>}
                    </div>
                    <span className="text-[10px] text-theme-text/30 uppercase">{result.type}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="flex items-center gap-4 px-5 py-2.5 border-t border-theme-border/10 text-[10px] text-theme-text/30">
            <span><kbd className="px-1 py-0.5 bg-theme-background/50 rounded border border-theme-border/10">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1 py-0.5 bg-theme-background/50 rounded border border-theme-border/10">Enter</kbd> Open</span>
            <span><kbd className="px-1 py-0.5 bg-theme-background/50 rounded border border-theme-border/10">Esc</kbd> Close</span>
          </div>
        )}
      </div>
    </div>
  );
}
