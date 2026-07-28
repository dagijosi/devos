import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaPlus, FaSearch, FaStar, FaFolder, FaFire, FaDatabase, FaFileImport } from 'react-icons/fa';
import { useProjects } from '../hooks/useProjects';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectWizard } from '../components/ProjectWizard';
import { ProjectScanner } from '../components/ProjectScanner';
import { Portal } from '../../../components/ui/overlays/Portal';

export function ProjectsPage() {
  const { projects, loading, toggleFavorite, refresh } = useProjects();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites' | 'active'>('all');
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
    return list;
  }, [projects, filter, search, selectedTech]);

  const favorites = projects.filter(p => p.favorite);
  const active = projects.filter(p => p.status === 'active');

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Sidebar */}
      <div className="w-56 shrink-0 space-y-1 hidden lg:flex flex-col">
        <div className="relative mb-3">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-text/30" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full bg-theme-surface border border-theme-border/30 rounded-xl pl-9 pr-3 py-2.5 text-xs text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
        </div>

        <SidebarSection
          label={`Favorites (${favorites.length})`}
          icon={<FaStar className="w-3.5 h-3.5 text-yellow-400" />}
          active={filter === 'favorites'}
          onClick={() => { setFilter('favorites'); setSearch(''); }}
        />

        <SidebarSection
          label={`Active (${active.length})`}
          icon={<FaFire className="w-3.5 h-3.5 text-green-400" />}
          active={filter === 'active'}
          onClick={() => { setFilter('active'); setSearch(''); }}
        />

        <SidebarSection
          label={`All (${projects.length})`}
          icon={<FaDatabase className="w-3.5 h-3.5 text-theme-icon" />}
          active={filter === 'all'}
          onClick={() => { setFilter('all'); setSearch(''); }}
        />

        <div className="mt-auto pt-4 space-y-1.5">
          <button onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 w-full px-3 py-2.5 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors">
            <FaPlus className="w-3 h-3" /> New Project
          </button>
          <button onClick={() => setShowScanner(true)}
            className="flex items-center gap-2 w-full px-3 py-2.5 bg-theme-surface border border-theme-border/30 text-theme-text rounded-xl text-sm font-medium hover:bg-theme-surface/80 transition-colors">
            <FaFileImport className="w-3 h-3" /> Import
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-4 overflow-y-auto">
        {/* Mobile search */}
        <div className="lg:hidden relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-text/30" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full bg-theme-surface border border-theme-border/30 rounded-xl pl-9 pr-3 py-2.5 text-xs text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(['all', 'favorites', 'active'] as const).map(f => (
            <button key={f} onClick={() => { setFilter(f); setSearch(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-theme-icon/10 text-theme-icon border border-theme-icon/30'
                  : 'bg-theme-surface text-theme-text/50 border border-theme-border/20 hover:border-theme-border/40'
              }`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <div className="ml-auto flex gap-1.5 lg:hidden">
            <button onClick={() => setShowWizard(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-icon text-white rounded-lg text-xs font-medium">
              <FaPlus className="w-2.5 h-2.5" /> New
            </button>
            <button onClick={() => setShowScanner(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-surface border border-theme-border/30 rounded-lg text-xs text-theme-text">
              <FaFileImport className="w-2.5 h-2.5" /> Import
            </button>
          </div>
        </div>

        {/* Tech chips */}
        {techs.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {techs.map(t => (
              <button key={t} onClick={() => setSelectedTech(selectedTech === t ? '' : t)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                  selectedTech === t
                    ? 'bg-theme-icon/10 text-theme-icon border border-theme-icon/30'
                    : 'bg-theme-background text-theme-text/40 border border-theme-border/10 hover:border-theme-border/30'
                }`}>
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Project Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-theme-border/20" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-theme-border/20 rounded w-2/3" />
                    <div className="h-3 bg-theme-border/20 rounded w-1/2" />
                  </div>
                </div>
                <div className="flex gap-1.5 mt-3">
                  <div className="h-5 bg-theme-border/10 rounded w-14" />
                  <div className="h-5 bg-theme-border/10 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FaFolder className="w-12 h-12 text-theme-text/10 mx-auto mb-3" />
            <p className="text-sm text-theme-text/40">
              {search ? 'No projects match your search' : filter === 'favorites' ? 'No favorite projects yet' : filter === 'active' ? 'No active projects' : 'No projects yet'}
            </p>
            {!search && (
              <button onClick={() => setShowWizard(true)}
                className="mt-4 px-5 py-2.5 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors">
                Create your first project
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
      </div>

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

function SidebarSection({ label, icon, active, onClick }: { label: string; icon: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active
          ? 'bg-theme-icon/10 text-theme-icon'
          : 'text-theme-text/50 hover:bg-theme-surface/50 hover:text-theme-text'
      }`}>
      {icon}
      {label}
    </button>
  );
}
