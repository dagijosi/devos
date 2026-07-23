import { useState, useEffect, useCallback } from 'react';
import { FaStar, FaRegStar, FaThumbtack, FaTag, FaFolder, FaProjectDiagram, FaTrash, FaUndo, FaExternalLinkAlt, FaTimes, FaSave } from 'react-icons/fa';
import { database } from '../../../database';
import { MarkdownEditor } from './MarkdownEditor';
import type { KnowledgeItem } from '../types';
import type { Project } from '../../projects/types';

interface KnowledgeDetailProps {
  item: KnowledgeItem;
  onUpdate: (item: KnowledgeItem) => void;
  onDelete: (id: number) => void;
  onRestore?: (id: number) => void;
  onClose: () => void;
}

export function KnowledgeDetail({ item, onUpdate, onDelete, onRestore, onClose }: KnowledgeDetailProps) {
  const [edit, setEdit] = useState<KnowledgeItem>(item);
  const [dirty, setDirty] = useState(false);
  const [related, setRelated] = useState<KnowledgeItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [projectNames, setProjectNames] = useState<Record<number, string>>({});

  useEffect(() => {
    setEdit(item);
    setDirty(false);
    database.getRelatedKnowledge(item.id).then(setRelated);
    database.updateKnowledgeLastOpened(item.id);
    database.getProjects().then(all => {
      setProjects(all);
      const map: Record<number, string> = {};
      all.forEach(p => { map[p.id] = p.name; });
      setProjectNames(map);
    });
  }, [item.id]);

  const update = useCallback((field: string, val: any) => {
    setEdit(prev => ({ ...prev, [field]: val }));
    setDirty(true);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    await database.updateKnowledgeItem(item.id, edit);
    setDirty(false);
    const updated = await database.getKnowledgeItem(item.id);
    if (updated) onUpdate(updated);
    setSaving(false);
  }, [item.id, edit, onUpdate]);

  const toggleFav = useCallback(async () => {
    await database.toggleKnowledgeFavorite(item.id);
    const updated = await database.getKnowledgeItem(item.id);
    if (updated) { setEdit(updated); onUpdate(updated); }
  }, [item.id, onUpdate]);

  const addTag = useCallback(() => {
    const t = tagInput.trim();
    if (!t || (edit.tags || []).includes(t)) return;
    update('tags', [...(edit.tags || []), t]);
    setTagInput('');
  }, [tagInput, edit.tags, update]);

  const removeTag = useCallback((tag: string) => {
    update('tags', (edit.tags || []).filter((t: string) => t !== tag));
  }, [edit.tags, update]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); }
  }, [save]);

  const isTrashed = item.status === 'trashed';

  return (
    <div className="flex-1 min-w-0 flex flex-col" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-theme-surface/50 text-theme-text/30 hover:text-theme-text"><FaTimes className="w-3.5 h-3.5" /></button>
        <div className="flex-1" />
        {!isTrashed && (
          <>
            <button onClick={toggleFav} className={`p-1.5 rounded-lg hover:bg-theme-surface/50 ${item.favorite ? 'text-yellow-400' : 'text-theme-text/30 hover:text-yellow-400'}`}>
              {item.favorite ? <FaStar className="w-3.5 h-3.5" /> : <FaRegStar className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => { database.toggleKnowledgePinned(item.id); update('pinned', !edit.pinned); }}
              className={`p-1.5 rounded-lg hover:bg-theme-surface/50 ${edit.pinned ? 'text-theme-icon' : 'text-theme-text/30 hover:text-theme-icon'}`}>
              <FaThumbtack className="w-3.5 h-3.5" />
            </button>
            <button onClick={save} disabled={!dirty || saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-icon text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-40 transition-opacity">
              <FaSave className="w-3 h-3" /> {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        )}
        {onRestore && isTrashed && (
          <button onClick={() => onRestore(item.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600"><FaUndo className="w-3 h-3" /> Restore</button>
        )}
        <button onClick={() => onDelete(item.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20"><FaTrash className="w-3 h-3" /> Delete</button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Title */}
        <input type="text" value={edit.title} onChange={e => update('title', e.target.value)}
          placeholder="Title" disabled={isTrashed}
          className="w-full bg-transparent text-xl font-bold text-theme-text placeholder:text-theme-text/20 outline-none" />

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-theme-text/40">
          <span className="capitalize">{(item.type === 'doc' ? 'documentation' : item.type)}</span>
          <div className="relative">
            <button onClick={() => !isTrashed && setShowProjectPicker(!showProjectPicker)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors ${edit.project_id ? 'bg-theme-icon/10 text-theme-icon' : 'text-theme-text/40 hover:text-theme-text/70'}`}>
              <FaFolder className="w-2.5 h-2.5" />
              {edit.project_id && projectNames[edit.project_id] ? projectNames[edit.project_id] : 'No project'}
            </button>
            {showProjectPicker && !isTrashed && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-theme-surface border border-theme-border/30 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                <button onClick={() => { update('project_id', null); setShowProjectPicker(false); }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-theme-background/50 ${!edit.project_id ? 'text-theme-icon font-medium' : 'text-theme-text/50'}`}>No project</button>
                {projects.map(p => (
                  <button key={p.id} onClick={() => { update('project_id', p.id); setShowProjectPicker(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-theme-background/50 ${edit.project_id === p.id ? 'text-theme-icon font-medium' : 'text-theme-text/50'}`}>
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span>Created {new Date(item.created_at).toLocaleDateString()}</span>
          <span>Updated {new Date(item.updated_at).toLocaleDateString()}</span>
        </div>

        {/* Type-specific fields */}
        {item.type === 'bug' && !isTrashed && (
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] text-theme-text/40 block mb-1">Problem</label>
              <textarea value={edit.problem} onChange={e => update('problem', e.target.value)} rows={2}
                className="w-full bg-theme-background border border-theme-border/20 rounded-xl px-3 py-2 text-sm text-theme-text outline-none focus:border-theme-icon/50 resize-none" /></div>
            <div><label className="text-[10px] text-theme-text/40 block mb-1">Cause</label>
              <textarea value={edit.cause} onChange={e => update('cause', e.target.value)} rows={2}
                className="w-full bg-theme-background border border-theme-border/20 rounded-xl px-3 py-2 text-sm text-theme-text outline-none focus:border-theme-icon/50 resize-none" /></div>
            <div className="col-span-2"><label className="text-[10px] text-theme-text/40 block mb-1">Solution</label>
              <textarea value={edit.solution} onChange={e => update('solution', e.target.value)} rows={2}
                className="w-full bg-theme-background border border-theme-border/20 rounded-xl px-3 py-2 text-sm text-theme-text outline-none focus:border-theme-icon/50 resize-none" /></div>
          </div>
        )}

        {item.type === 'snippet' && !isTrashed && (
          <div><label className="text-[10px] text-theme-text/40 block mb-1">Language</label>
            <input value={edit.language} onChange={e => update('language', e.target.value)}
              className="w-full bg-theme-background border border-theme-border/20 rounded-xl px-3 py-2 text-sm text-theme-text outline-none focus:border-theme-icon/50" /></div>
        )}

        {item.type === 'bookmark' && !isTrashed && (
          <div><label className="text-[10px] text-theme-text/40 block mb-1">URL</label>
            <div className="flex gap-2"><input value={edit.url} onChange={e => update('url', e.target.value)} placeholder="https://..."
              className="flex-1 bg-theme-background border border-theme-border/20 rounded-xl px-3 py-2 text-sm text-theme-text outline-none focus:border-theme-icon/50" />
              <a href={edit.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl text-theme-text/30 hover:text-theme-icon"><FaExternalLinkAlt className="w-3.5 h-3.5" /></a>
            </div>
          </div>
        )}

        {/* Tags */}
        <div>
          <label className="text-[10px] text-theme-text/40 block mb-1 flex items-center gap-1"><FaTag className="w-2.5 h-2.5" /> Tags</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(edit.tags || []).map(t => (
              <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-theme-icon/10 text-theme-icon rounded-full text-[10px] font-medium">
                #{t}
                {!isTrashed && <button onClick={() => removeTag(t)} className="hover:text-red-400"><FaTimes className="w-2 h-2" /></button>}
              </span>
            ))}
          </div>
          {!isTrashed && (
            <div className="flex gap-1">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add tag..." className="flex-1 bg-theme-background border border-theme-border/20 rounded-lg px-2.5 py-1.5 text-xs text-theme-text placeholder:text-theme-text/30 outline-none focus:border-theme-icon/50" />
              <button onClick={addTag} className="px-2 py-1 bg-theme-icon/10 text-theme-icon rounded-lg text-xs font-medium hover:bg-theme-icon/20">Add</button>
            </div>
          )}
        </div>

        {/* Markdown Content */}
        {isTrashed ? (
          <div className="min-h-[200px] bg-theme-background/30 rounded-2xl p-4 text-sm text-theme-text/40 whitespace-pre-wrap">{item.content}</div>
        ) : (
          <MarkdownEditor value={edit.content} onChange={v => update('content', v)} />
        )}

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-theme-text/50 uppercase tracking-wider mb-2">Related Knowledge</h4>
            <div className="space-y-1.5">
              {related.map(r => (
                <button key={r.id} onClick={() => onUpdate(r)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-theme-background/30 text-sm text-left">
                  <span className="text-[10px] uppercase text-theme-text/30">{r.type}</span>
                  <span className="text-theme-text truncate">{r.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
