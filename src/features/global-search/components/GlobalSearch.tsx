import { motion, AnimatePresence } from 'framer-motion';
import { Portal } from '../../../components/ui/overlays';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../../../database';
import { PROJECTS, KNOWLEDGE } from '../../../routes/types/routeConstants';
import { FaSearch, FaProjectDiagram, FaStickyNote, FaCode, FaBug, FaFileAlt, FaBookmark } from 'react-icons/fa';
import type { Project } from '../../projects/types';
import type { Note, CodeSnippet, Bug, KnowledgeItem } from '../../knowledge/types';

interface SearchResult {
  id: string;
  label: string;
  description: string;
  type: 'project' | 'note' | 'snippet' | 'bug' | 'knowledge' | 'tool';
  action: () => void;
}

const typeIcons: Record<string, React.ElementType> = {
  project: FaProjectDiagram,
  note: FaStickyNote,
  snippet: FaCode,
  bug: FaBug,
  knowledge: FaFileAlt,
  tool: FaBookmark,
};

const typeColors: Record<string, string> = {
  project: 'text-blue-400 bg-blue-500/10',
  note: 'text-emerald-400 bg-emerald-500/10',
  snippet: 'text-amber-400 bg-amber-500/10',
  bug: 'text-red-400 bg-red-500/10',
  knowledge: 'text-violet-400 bg-violet-500/10',
  tool: 'text-cyan-400 bg-cyan-500/10',
};

export function GlobalSearch() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const [projects, notes, snippets, bugs, knowledgeItems] = await Promise.all([
        database.getProjects(),
        database.getNotes(),
        database.getSnippets(),
        database.getBugs(),
        database.getKnowledgeItems().catch(() => []),
      ]);
      const ql = q.toLowerCase();
      const all: SearchResult[] = [];
      projects.forEach((p: Project) => {
        if (p.name?.toLowerCase().includes(ql) || (p.description || '').toLowerCase().includes(ql)) {
          all.push({ id: `proj-${p.id}`, label: p.name, description: p.description || 'Project', type: 'project', action: () => navigate(`${PROJECTS}/${p.id}`) });
        }
      });
      notes.forEach((n: Note) => {
        if (n.title?.toLowerCase().includes(ql) || (n.content || '').toLowerCase().includes(ql)) {
          all.push({ id: `note-${n.id}`, label: n.title, description: (n.content || '').slice(0, 80), type: 'note', action: () => navigate(KNOWLEDGE) });
        }
      });
      snippets.forEach((s: CodeSnippet) => {
        if (s.title?.toLowerCase().includes(ql) || s.code?.toLowerCase().includes(ql)) {
          all.push({ id: `snip-${s.id}`, label: s.title, description: `${s.language || 'code'} snippet`, type: 'snippet', action: () => navigate(KNOWLEDGE) });
        }
      });
      bugs.forEach((b: Bug) => {
        if (b.title?.toLowerCase().includes(ql) || b.problem?.toLowerCase().includes(ql)) {
          all.push({ id: `bug-${b.id}`, label: b.title, description: (b.problem || '').slice(0, 80), type: 'bug', action: () => navigate(KNOWLEDGE) });
        }
      });
      knowledgeItems.forEach((k: KnowledgeItem) => {
        if (k.title?.toLowerCase().includes(ql) || (k.content || '').toLowerCase().includes(ql)) {
          all.push({ id: `know-${k.id}`, label: k.title, description: `${k.type || 'item'} · ${(k.content || '').slice(0, 60)}`, type: 'knowledge', action: () => navigate(KNOWLEDGE) });
        }
      });
      setResults(all.slice(0, 20));
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        setIsOpen(o => !o);
        setQuery('');
        setResults([]);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  useEffect(() => {
    const handleNav = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        setIsOpen(false);
        setQuery('');
        results[selectedIndex].action();
      }
    };
    window.addEventListener('keydown', handleNav);
    return () => window.removeEventListener('keydown', handleNav);
  }, [isOpen, results, selectedIndex]);

  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('button');
      (items[selectedIndex] as HTMLElement)?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => { setIsOpen(false); setQuery(''); }} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }} transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-full max-w-xl">
            <div className="bg-theme-surface border border-theme-border/40 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center px-4 border-b border-theme-border/20">
                <FaSearch className="w-4 h-4 text-theme-text/40 mr-3 flex-shrink-0" />
                <input ref={inputRef} autoFocus type="text" value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Search projects, notes, snippets, bugs..."
                  className="flex-1 bg-transparent text-theme-text placeholder-theme-text/40 py-4 text-sm outline-none" />
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-theme-text/40 bg-theme-background rounded border border-theme-border/20">ESC</kbd>
              </div>
              <div className="max-h-80 overflow-y-auto p-2" ref={listRef}>
                {loading ? (
                  <div className="text-center py-8 text-theme-text/40 text-sm">Searching...</div>
                ) : query && results.length === 0 ? (
                  <div className="text-center py-8 text-theme-text/40 text-sm">No results found</div>
                ) : !query ? (
                  <div className="text-center py-8 text-theme-text/40 text-sm">Type to search across all data</div>
                ) : (
                  <div className="space-y-1">
                    {results.map((r, i) => {
                      const Icon = typeIcons[r.type] || FaSearch;
                      return (
                        <button key={r.id} onClick={() => { setIsOpen(false); setQuery(''); r.action(); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                            i === selectedIndex ? 'bg-theme-background/50' : 'hover:bg-theme-background/50'
                          }`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors[r.type] || 'bg-theme-background/50 text-theme-text/40'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-theme-text truncate">{r.label}</div>
                            <div className="text-xs text-theme-text/40 truncate">{r.description}</div>
                          </div>
                          <span className="text-[10px] uppercase text-theme-text/20 font-medium">{r.type}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="px-4 py-2 border-t border-theme-border/20 bg-theme-background/50 flex items-center gap-4 text-xs text-theme-text/40">
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-theme-surface rounded border border-theme-border/20">↑↓</kbd> Navigate</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-theme-surface rounded border border-theme-border/20">↵</kbd> Open</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-theme-surface rounded border border-theme-border/20">Esc</kbd> Close</span>
                <span className="ml-auto"><kbd className="px-1.5 py-0.5 bg-theme-surface rounded border border-theme-border/20">Ctrl+Shift+F</kbd></span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return <Portal>{content}</Portal>;
}
