import { useState, useEffect, useCallback, useRef } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { database } from '../../../database';
import { LibrarySidebar } from '../components/LibrarySidebar';
import { KnowledgeCard } from '../components/KnowledgeCard';
import { KnowledgeDetail } from '../components/KnowledgeDetail';
import { CreateMenu } from '../components/CreateMenu';
import type { KnowledgeItem, KnowledgeType } from '../types';

interface LibraryPageProps {
  projectId?: number;
}

export function LibraryPage({ projectId }: LibraryPageProps) {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<KnowledgeItem | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [projectNames, setProjectNames] = useState<Record<number, string>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const loadProjectNames = useCallback(async () => {
    const all = await database.getProjects();
    const map: Record<number, string> = {};
    all.forEach(p => { map[p.id] = p.name; });
    setProjectNames(map);
  }, []);

  const loadCounts = useCallback(async () => {
    const types = ['note', 'bug', 'snippet', 'prompt', 'doc', 'bookmark', 'template'];
    const counts: Record<string, number> = {};
    for (const t of types) counts[t] = await database.getKnowledgeCountByType(t);
    const all = await database.getKnowledgeItems();
    counts.favorites = all.filter(i => i.favorite).length;
    counts.recent = 0;
    counts.trash = (await database.getTrashedKnowledge()).length;
    setCounts(counts);
  }, []);

  const load = useCallback(async (category?: string | null, query?: string, pid?: number) => {
    setLoading(true);
    let data: KnowledgeItem[];
    if (query) data = await database.searchKnowledge(query);
    else if (category === 'trash') data = await database.getTrashedKnowledge();
    else if (category === 'favorites') data = await database.getFavoriteKnowledge();
    else if (category === 'recent') data = await database.getRecentKnowledge(20);
    else if (category) data = await database.getKnowledgeItems(category);
    else if (pid) data = await database.getKnowledgeByProject(pid);
    else data = await database.getKnowledgeItems();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProjectNames();
  }, []);

  useEffect(() => {
    load(activeCategory, undefined, projectId);
    loadCounts();
  }, [activeCategory, projectId]);

  const handleCreate = useCallback(async (type: KnowledgeType) => {
    const created = await database.createKnowledgeItem({
      title: 'Untitled', type,
      project_id: projectId ?? null,
    });
    if (created) {
      setItems(prev => [created, ...prev]);
      setSelected(created);
      await database.addActivity('knowledge', created.id, 'created', `${type} "${created.title}" created`);
      loadCounts();
    }
  }, [loadCounts, projectId]);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load(activeCategory, q);
      loadCounts();
    }, 300);
  }, [activeCategory, load, loadCounts]);

  const handleCategory = useCallback((type: string | null) => {
    setActiveCategory(type);
    setSearch('');
    setSelected(null);
  }, []);

  const handleToggleFavorite = useCallback(async (id: number) => {
    await database.toggleKnowledgeFavorite(id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, favorite: !i.favorite } : i));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, favorite: !prev.favorite } : null);
    loadCounts();
  }, [selected, loadCounts]);

  const handleUpdate = useCallback((item: KnowledgeItem) => {
    setItems(prev => prev.map(i => i.id === item.id ? item : i));
    setSelected(item);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    await database.deleteKnowledgeItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
    setSelected(null);
    loadCounts();
  }, [loadCounts]);

  const handleRestore = useCallback(async (id: number) => {
    await database.restoreKnowledgeItem(id);
    load(activeCategory);
    setSelected(null);
    loadCounts();
  }, [activeCategory, load, loadCounts]);

  const isTrash = activeCategory === 'trash';

  return (
    <div className="flex gap-6 h-[calc(100vh-10rem)]">
      {/* Sidebar */}
      <LibrarySidebar activeCategory={activeCategory} onCategory={handleCategory} counts={counts} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search + Create */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-text/30" />
            <input value={search} onChange={e => handleSearch(e.target.value)}
              placeholder="Search everything..." autoFocus
              className="w-full pl-9 pr-9 py-2.5 bg-theme-surface border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
            {search && <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text/30 hover:text-theme-text"><FaTimes className="w-3 h-3" /></button>}
          </div>
          {!isTrash && <CreateMenu onCreate={handleCreate} />}
        </div>

        {/* Content area */}
        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* List */}
          <div className={`overflow-y-auto ${selected ? 'w-1/3 min-w-[280px]' : 'flex-1'}`}>
            {loading ? (
              <div className="grid grid-cols-1 gap-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-24 rounded-2xl bg-theme-surface border border-theme-border/20 animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-theme-text/30 mb-1">{search ? 'No results found' : 'Nothing here yet'}</p>
                {!search && !isTrash && <p className="text-xs text-theme-text/20">Click the + New button to create something</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {items.map(item => (
                  <KnowledgeCard key={item.id} item={item} selected={selected?.id === item.id}
                    onSelect={setSelected} onToggleFavorite={handleToggleFavorite}
                    projectName={projectNames[item.project_id ?? -1]} />
                ))}
              </div>
            )}
          </div>

          {/* Detail */}
          {selected && (
            <div className="flex-1 min-w-0 overflow-y-auto border-l border-theme-border/10 pl-6">
              <KnowledgeDetail item={selected} onUpdate={handleUpdate} onDelete={isTrash ? (id) => database.deleteKnowledgeItem(id, true).then(() => { setItems(prev => prev.filter(i => i.id !== id)); setSelected(null); loadCounts(); }) : handleDelete}
                onRestore={isTrash ? handleRestore : undefined} onClose={() => setSelected(null)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
