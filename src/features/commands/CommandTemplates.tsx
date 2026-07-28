import { useState } from 'react';
import { FaTerminal, FaSearch, FaPlus, FaTimes, FaTrash, FaStar, FaRegStar, FaCopy, FaCheck } from 'react-icons/fa';
import { toast } from 'sonner';
import { database } from '../../database';
import { useSWR } from '../../hooks/useSWR';

const CATEGORIES = ['dev', 'build', 'test', 'lint', 'deploy', 'docker', 'git', 'db'];
const CATEGORY_LABELS: Record<string, string> = { dev: 'Dev', build: 'Build', test: 'Test', lint: 'Lint', deploy: 'Deploy', docker: 'Docker', git: 'Git', db: 'Database' };
const CATEGORY_COLORS: Record<string, string> = {
  dev: 'bg-blue-500/10 text-blue-400', build: 'bg-purple-500/10 text-purple-400',
  test: 'bg-green-500/10 text-green-400', lint: 'bg-yellow-500/10 text-yellow-400',
  deploy: 'bg-red-500/10 text-red-400', docker: 'bg-cyan-500/10 text-cyan-400',
  git: 'bg-orange-500/10 text-orange-400', db: 'bg-pink-500/10 text-pink-400',
};

interface Props {
  projectTechnology?: string;
  onUse?: (command: string) => void;
}

export function CommandTemplates({ projectTechnology, onUse }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', description: '', command: '', technology: projectTechnology || '', category: 'dev' });

  const key = `cmd-templates:${activeCategory || 'all'}:${projectTechnology || 'all'}`;
  const { data: allTemplates, loading, refetch } = useSWR(key, async () => {
    if (projectTechnology && !activeCategory) {
      const byTech = await database.getCommandTemplates(projectTechnology);
      const all = await database.getCommandTemplates();
      const techSet = new Set(byTech.map((t: any) => t.id));
      return [...byTech, ...all.filter((t: any) => !techSet.has(t.id))];
    }
    if (activeCategory) return database.getCommandTemplatesByCategory(activeCategory);
    return database.getCommandTemplates();
  });

  const filtered = (allTemplates || []).filter((t: any) =>
    !search.trim() || t.name.toLowerCase().includes(search.toLowerCase()) || t.command.toLowerCase().includes(search.toLowerCase()) || t.technology?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!form.name.trim() || !form.command.trim()) return;
    await database.createCommandTemplate(form);
    setForm({ name: '', description: '', command: '', technology: projectTechnology || '', category: 'dev' });
    setShowForm(false);
    refetch();
    toast.success('Template created');
  };

  const handleUse = async (tpl: any) => {
    await database.incrementCommandTemplateUsage(tpl.id);
    if (onUse) onUse(tpl.command);
    else {
      navigator.clipboard.writeText(tpl.command);
      setCopiedId(tpl.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success('Copied to clipboard');
    }
  };

  const handleToggleFavorite = async (id: number) => {
    await database.toggleCommandTemplateFavorite(id);
    refetch();
  };

  if (loading) return <div className="text-center py-8 text-xs text-theme-text/40">Loading templates...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-theme-text/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search command templates..." className="w-full bg-theme-surface border border-theme-border/20 rounded-xl pl-9 pr-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50" />
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-theme-icon text-white rounded-xl hover:bg-theme-icon/90 transition-colors">
          <FaPlus className="w-3 h-3" /> New
        </button>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setActiveCategory(null)}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${!activeCategory ? 'bg-theme-icon/10 text-theme-icon' : 'text-theme-text/40 hover:text-theme-text'}`}>
          All
        </button>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${activeCategory === cat ? CATEGORY_COLORS[cat] : 'text-theme-text/40 hover:text-theme-text bg-theme-background/30'}`}>
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="bg-theme-surface border border-theme-border/20 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-theme-text/40 uppercase mb-1 block">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. npm run dev" className="w-full bg-theme-background border border-theme-border/30 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50" />
            </div>
            <div>
              <label className="text-[10px] font-medium text-theme-text/40 uppercase mb-1 block">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full bg-theme-background border border-theme-border/30 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50">
                {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-medium text-theme-text/40 uppercase mb-1 block">Command</label>
            <input value={form.command} onChange={e => setForm(f => ({ ...f, command: e.target.value }))} placeholder="npm run dev" className="w-full bg-theme-background border border-theme-border/30 rounded-lg px-3 py-2 text-xs font-mono text-theme-text outline-none focus:border-theme-icon/50" />
          </div>
          <div>
            <label className="text-[10px] font-medium text-theme-text/40 uppercase mb-1 block">Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Start the development server" className="w-full bg-theme-background border border-theme-border/30 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50" />
          </div>
          <button onClick={handleAdd} disabled={!form.name.trim() || !form.command.trim()}
            className="w-full py-2 text-xs font-medium bg-theme-icon text-white rounded-lg hover:bg-theme-icon/90 transition-colors disabled:opacity-50">
            Create Template
          </button>
        </div>
      )}

      <div className="space-y-1.5">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-theme-text/30 text-xs">
            <FaTerminal className="w-6 h-6 mx-auto mb-2 opacity-40" />
            {search ? 'No matching templates' : 'No command templates yet'}
          </div>
        ) : (
          filtered.map((tpl: any) => (
            <div key={tpl.id} className="flex items-center gap-3 px-3 py-2.5 bg-theme-surface border border-theme-border/20 rounded-xl hover:border-theme-icon/20 transition-colors group">
              <FaTerminal className="w-3.5 h-3.5 text-theme-text/30 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-theme-text">{tpl.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${CATEGORY_COLORS[tpl.category] || 'bg-theme-background text-theme-text/40'}`}>{CATEGORY_LABELS[tpl.category] || tpl.category}</span>
                  {tpl.technology && <span className="text-[9px] text-theme-text/30">{tpl.technology}</span>}
                </div>
                <p className="text-[10px] font-mono text-theme-text/40 truncate">{tpl.command}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleToggleFavorite(tpl.id)} className="p-1.5 rounded-lg hover:bg-yellow-400/10 transition-colors">
                  {tpl.favorite ? <FaStar className="w-3 h-3 text-yellow-400" /> : <FaRegStar className="w-3 h-3 text-theme-text/30" />}
                </button>
                <button onClick={() => handleUse(tpl)} className="p-1.5 rounded-lg hover:bg-green-500/10 transition-colors" title={onUse ? 'Use command' : 'Copy'}>
                  {copiedId === tpl.id ? <FaCheck className="w-3 h-3 text-green-400" /> : onUse ? <FaTerminal className="w-3 h-3 text-green-400" /> : <FaCopy className="w-3 h-3 text-theme-text/40" />}
                </button>
                <button onClick={async () => { await database.deleteCommandTemplate(tpl.id); refetch(); }} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                  <FaTrash className="w-3 h-3 text-theme-text/30 hover:text-red-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
