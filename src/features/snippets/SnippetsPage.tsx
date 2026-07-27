import { useState, useEffect, useCallback, useMemo } from 'react';
import { FaCode, FaPlus, FaEdit, FaTrash, FaCopy, FaTerminal, FaSearch, FaStar, FaRegStar, FaTimes, FaDownload } from 'react-icons/fa';
import { database } from '../../database';
import { toast } from 'sonner';
import LoadingComponent from '../../components/ui/feedback/LoadingComponent';
import Modal from '../../components/ui/overlays/Modal';
import { getProjectContext } from '../projects/utils/projectContext';

interface Snippet {
  id: number;
  title: string;
  code: string;
  language: string;
  description: string;
  tags: string[];
  favorite: boolean;
  project_id: number | null;
  created_at: string;
}

const LANGUAGES = ['typescript', 'javascript', 'rust', 'python', 'css', 'html', 'json', 'yaml', 'shell', 'sql'];

export function SnippetsPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<Snippet | null>(null);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await database.getSnippets();
      setSnippets(all as unknown as Snippet[]);
    } catch { setSnippets([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => snippets.filter(s => {
    if (search && !s.title.toLowerCase().includes(search.toLowerCase()) && !s.code.toLowerCase().includes(search.toLowerCase())) return false;
    if (langFilter && s.language !== langFilter) return false;
    return true;
  }), [snippets, search, langFilter]);

  const exportAsJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'snippets.json'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as JSON');
  };

  const exportAsCSV = () => {
    const headers = 'id,title,language,description,tags,code';
    const rows = filtered.map(s => {
      const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
      return [s.id, esc(s.title), s.language, esc(s.description), esc(s.tags.join('; ')), esc(s.code)].join(',');
    });
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'snippets.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as CSV');
  };

  const resetForm = () => {
    setEditing(null); setTitle(''); setCode(''); setLanguage('typescript');
    setDescription(''); setTags([]); setTagInput(''); setShowEditor(false);
  };

  const openEdit = (s: Snippet) => {
    setEditing(s); setTitle(s.title); setCode(s.code); setLanguage(s.language);
    setDescription(s.description); setTags(s.tags); setShowEditor(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !code.trim()) return;
    const data = { title: title.trim(), code: code.trim(), language, description: description.trim(), tags: JSON.stringify(tags), favorite: 0, project_id: (getProjectContext()?.id as number) || null };
    try {
      if (editing) {
        await database.updateSnippet(editing.id, { ...data, favorite: editing.favorite ? 1 : 0 } as any);
      } else {
        await database.createSnippet(data as any);
      }
      resetForm();
      await load();
      toast.success(editing ? 'Snippet updated' : 'Snippet saved');
    } catch (e) { toast.error('Failed to save snippet'); }
  };

  const handleDelete = async (id: number) => {
    try { await database.deleteSnippet(id); await load(); toast.success('Snippet deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  const handleToggleFav = async (id: number) => {
    try { await database.toggleSnippetFavorite(id); await load(); }
    catch { /* ignore */ }
  };

  const handleCopy = async (s: Snippet) => {
    try {
      await navigator.clipboard.writeText(s.code);
      toast.success('Copied to clipboard');
    } catch { toast.error('Failed to copy'); }
  };

  const handleSendToTerminal = async (s: Snippet) => {
    if (!s.code.trim()) return;
    try {
      await navigator.clipboard.writeText(s.code);
      toast.success('Code copied — paste in terminal');
    } catch { toast.error('Failed to copy'); }
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FaCode className="w-6 h-6 text-theme-icon" />
          <div>
            <h1 className="text-2xl font-bold text-theme-text">Snippet Manager</h1>
            <p className="text-xs text-theme-text/40 mt-0.5">Save and organize code snippets</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-theme-surface/50 border border-theme-border/20 rounded-xl p-0.5">
            <button onClick={exportAsJSON}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-theme-text/60 hover:text-theme-text hover:bg-theme-surface/80 rounded-lg transition-colors">
              <FaDownload className="w-3 h-3" /> JSON
            </button>
            <button onClick={exportAsCSV}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-theme-text/60 hover:text-theme-text hover:bg-theme-surface/80 rounded-lg transition-colors">
              <FaDownload className="w-3 h-3" /> CSV
            </button>
          </div>
          <button onClick={() => { resetForm(); setShowEditor(true); }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-theme-icon text-white rounded-xl hover:bg-theme-icon/90 transition-colors">
            <FaPlus className="w-3.5 h-3.5" /> New Snippet
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-text/30" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search snippets..."
            className="w-full bg-theme-surface border border-theme-border/20 rounded-xl pl-9 pr-4 py-2 text-xs text-theme-text placeholder:text-theme-text/30 outline-none focus:border-theme-icon/50" />
        </div>
        <select value={langFilter} onChange={e => setLangFilter(e.target.value)}
          className="bg-theme-surface border border-theme-border/20 rounded-xl px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50">
          <option value="">All languages</option>
          {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {loading ? <LoadingComponent /> : filtered.length === 0 ? (
        <div className="text-center py-12">
          <FaCode className="w-10 h-10 text-theme-text/20 mx-auto mb-3" />
          <p className="text-sm font-medium text-theme-text/60">No snippets</p>
          <p className="text-xs text-theme-text/40 mt-1">{search ? 'Try a different search' : 'Click "New Snippet" to add one'}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(s => (
            <div key={s.id}
              className="bg-theme-surface border border-theme-border/20 rounded-xl p-4 space-y-2 group hover:border-theme-icon/30 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-theme-text truncate">{s.title}</p>
                    <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-theme-icon/10 text-theme-icon rounded">{s.language}</span>
                  </div>
                  {s.description && <p className="text-[11px] text-theme-text/40 mt-0.5 line-clamp-1">{s.description}</p>}
                </div>
                <button onClick={() => handleToggleFav(s.id)}
                  className="shrink-0 p-1 rounded hover:bg-theme-border/20 transition-colors">
                  {s.favorite ? <FaStar className="w-3.5 h-3.5 text-yellow-400" /> : <FaRegStar className="w-3.5 h-3.5 text-theme-text/30" />}
                </button>
              </div>

              <pre className="bg-theme-background border border-theme-border/10 rounded-lg p-3 text-[11px] font-mono text-theme-text/70 overflow-x-auto max-h-24"><code>{s.code}</code></pre>

              {s.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {s.tags.map(t => <span key={t} className="px-1.5 py-0.5 text-[9px] bg-theme-border/10 text-theme-text/40 rounded">{t}</span>)}
                </div>
              )}

              <div className="flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleCopy(s)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium bg-theme-border/10 text-theme-text/50 hover:text-theme-text rounded-lg transition-colors">
                  <FaCopy className="w-3 h-3" /> Copy
                </button>
                <button onClick={() => handleSendToTerminal(s)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors">
                  <FaTerminal className="w-3 h-3" /> Terminal
                </button>
                <button onClick={() => openEdit(s)} className="flex items-center justify-center px-2 py-1.5 text-[10px] font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors">
                  <FaEdit className="w-3 h-3" />
                </button>
                <button onClick={() => handleDelete(s.id)} className="flex items-center justify-center px-2 py-1.5 text-[10px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                  <FaTrash className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor modal */}
      <Modal isOpen={showEditor} onClose={resetForm} title={editing ? 'Edit Snippet' : 'New Snippet'} size="lg"
        footer={
          <div className="flex items-center gap-2">
            <button onClick={resetForm} className="px-4 py-2 text-xs text-theme-text/50 hover:text-theme-text transition-colors">Cancel</button>
            <button onClick={handleSave}
              className="px-5 py-2 text-xs font-medium bg-theme-icon text-white rounded-xl hover:bg-theme-icon/90 transition-colors">{editing ? 'Update' : 'Save'}</button>
          </div>
        }>
        <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-medium text-theme-text/40 uppercase tracking-wider">Title</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="Snippet name"
                    className="w-full mt-1 bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
                </div>
                <div className="w-40">
                  <label className="text-[10px] font-medium text-theme-text/40 uppercase tracking-wider">Language</label>
                  <select value={language} onChange={e => setLanguage(e.target.value)}
                    className="w-full mt-1 bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text outline-none focus:border-theme-icon/50">
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-medium text-theme-text/40 uppercase tracking-wider">Description</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Optional description"
                  className="w-full mt-1 bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-theme-text/40 uppercase tracking-wider">Code</label>
                <textarea value={code} onChange={e => setCode(e.target.value)}
                  placeholder="Paste your code here..."
                  rows={10}
                  className="w-full mt-1 bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm font-mono text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 resize-y" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-theme-text/40 uppercase tracking-wider">Tags</label>
                <div className="flex gap-2 mt-1">
                  <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="Add tag..."
                    className="flex-1 bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2 text-xs text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
                  <button onClick={addTag}
                    className="px-3 py-2 text-xs font-medium bg-theme-icon/10 text-theme-icon rounded-xl hover:bg-theme-icon/20 transition-colors">Add</button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map(t => (
                      <span key={t} className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-theme-border/10 text-theme-text/50 rounded">
                        {t}
                        <button onClick={() => setTags(tags.filter(x => x !== t))} className="hover:text-red-400"><FaTimes className="w-2.5 h-2.5" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
      </Modal>
    </div>
  );
}
