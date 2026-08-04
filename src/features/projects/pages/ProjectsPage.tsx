import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaPlus, FaSearch, FaFolder, FaFileImport, FaSort } from 'react-icons/fa';
import { useProjects } from '../hooks/useProjects';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectWizard } from '../components/ProjectWizard';
import { ProjectScanner } from '../components/ProjectScanner';
import { Portal } from '../../../components/ui/overlays/Portal';

type Filter = 'all' | 'favorites' | 'active';
type Sort = 'opened' | 'updated' | 'name';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'active', label: 'Active' },
];

const SORTS: { id: Sort; label: string }[] = [
  { id: 'opened', label: 'Recently opened' },
  { id: 'updated', label: 'Recently updated' },
  { id: 'name', label: 'Name' },
];

export function ProjectsPage() {
  const { projects, loading, toggleFavorite, refresh } = useProjects();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('opened');
  const [showWizard, setShowWizard] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (searchParams.get('new') !== 'true') return;
    setShowWizard(true);
    setSearchParams(params => {
      const next = new URLSearchParams(params);
      next.delete('new');
      return next;
    }, { replace: true });
  }, [searchParams, setSearchParams]);

  const techs = useMemo(() => {
    const raw = projects.flatMap(p => Array.isArray(p.technology) ? p.technology : []);
    const all = raw.filter((t): t is string => typeof t === 'string');
    return [...new Set(all)].slice(0, 8);
  }, [projects]);

  const [selectedTech, setSelectedTech] = useState('');

  const filtered = useMemo(() => {
    let list = projects;
    if (filter === 'favorites') list = list.filter(p => p.favorite);
    if (filter === 'active') list = list.filter(p => p.status === 'active');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (Array.isArray(p.tags) ? p.tags : []).some(t => t.toLowerCase().includes(q)) ||
        (Array.isArray(p.technology) ? p.technology : []).some(t => t.toLowerCase().includes(q))
      );
    }
    if (selectedTech) list = list.filter(p => (Array.isArray(p.technology) ? p.technology : []).includes(selectedTech));
    return [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      const aT = new Date(sort === 'opened' ? a.last_opened || 0 : a.updated_at || 0).getTime();
      const bT = new Date(sort === 'opened' ? b.last_opened || 0 : b.updated_at || 0).getTime();
      return bT - aT;
    });
  }, [projects, filter, search, selectedTech, sort]);

  const showFilters = filter !== 'all' || search || selectedTech;

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-text/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects, tags, or technologies..."
            className="w-full bg-theme-surface border border-theme-border/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/35 outline-none focus:border-theme-icon/50 focus:ring-2 focus:ring-theme-icon/10 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text/30 hover:text-theme-text text-xs"
            >
              Clear
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-theme-surface border border-theme-border/20 text-theme-text/70 rounded-xl text-sm font-medium hover:border-theme-border/40 hover:text-theme-text transition-all"
          >
            <FaFileImport className="w-3.5 h-3.5" /> Import
          </button>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors shadow-sm shadow-theme-icon/20"
          >
            <FaPlus className="w-3.5 h-3.5" /> New Project
          </button>
        </div>
      </div>

      {/* Filter + sort row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-theme-surface border border-theme-border/20 rounded-xl">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => { setFilter(f.id); setSearch(''); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f.id
                  ? 'bg-theme-icon/10 text-theme-icon'
                  : 'text-theme-text/50 hover:text-theme-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {techs.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {techs.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTech(selectedTech === t ? '' : t)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  selectedTech === t
                    ? 'bg-theme-icon/10 text-theme-icon'
                    : 'bg-theme-surface text-theme-text/40 border border-theme-border/10 hover:border-theme-border/30 hover:text-theme-text/70'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        <label className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-theme-text/40 hover:text-theme-text/70 transition-colors">
          <FaSort className="w-3 h-3" />
          <select
            value={sort}
            onChange={e => setSort(e.target.value as Sort)}
            className="bg-transparent outline-none cursor-pointer"
          >
            {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {/* Results count */}
      <div className="text-xs text-theme-text/35">
        {filtered.length} {filtered.length === 1 ? 'project' : 'projects'}
        {showFilters && ' found'}
      </div>

      {/* Project grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-theme-surface border border-theme-border/20 rounded-2xl p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-theme-border/20" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-theme-border/20 rounded w-2/3" />
                  <div className="h-3 bg-theme-border/20 rounded w-1/2" />
                </div>
              </div>
              <div className="h-5 bg-theme-border/10 rounded w-24 mt-4" />
              <div className="h-4 bg-theme-border/10 rounded w-full mt-3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-theme-surface border border-theme-border/20 flex items-center justify-center mx-auto mb-4">
            <FaFolder className="w-6 h-6 text-theme-text/20" />
          </div>
          <p className="text-sm font-medium text-theme-text/50">
            {search || selectedTech ? 'No projects match your filters' : filter === 'favorites' ? 'No favorites yet' : filter === 'active' ? 'No active projects' : 'No projects yet'}
          </p>
          <p className="text-xs text-theme-text/30 mt-1">
            {search || selectedTech ? 'Try adjusting your search or clearing filters' : 'Create your first project to get started'}
          </p>
          {!search && !selectedTech && (
            <button
              onClick={() => setShowWizard(true)}
              className="mt-5 px-5 py-2.5 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors"
            >
              Create your first project
            </button>
          )}
          {(search || selectedTech) && (
            <button
              onClick={() => { setSearch(''); setSelectedTech(''); }}
              className="mt-5 px-5 py-2.5 bg-theme-surface border border-theme-border/20 text-theme-text rounded-xl text-sm font-medium hover:border-theme-border/40 transition-all"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => (
            <ProjectCard key={p.id} project={p} onToggleFavorite={toggleFavorite} />
          ))}
        </div>
      )}

      {/* Modals */}
      {showWizard && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-xl py-8">
              <ProjectWizard onClose={() => { setShowWizard(false); refresh(); }} />
            </div>
          </div>
        </Portal>
      )}

      {showScanner && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <ProjectScanner onClose={() => { setShowScanner(false); }} />
          </div>
        </Portal>
      )}
    </div>
  );
}
