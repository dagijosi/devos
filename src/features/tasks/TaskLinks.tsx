import { useState, useEffect } from 'react';
import { FaLink, FaStickyNote, FaBug, FaGitCommit, FaCloudUploadAlt, FaPlus, FaTrash, FaUnlink } from 'react-icons/fa';
import { database } from '../../database';
import { toast } from 'sonner';

interface TaskLink {
  id: number;
  task_id: number;
  linked_type: 'note' | 'bug' | 'commit' | 'deployment' | 'knowledge';
  linked_id: number;
  linked_title: string;
}

interface Props {
  taskId: number;
  projectId?: number;
}

const TYPE_ICONS: Record<string, React.ElementType> = { note: FaStickyNote, bug: FaBug, commit: FaGitCommit, deployment: FaCloudUploadAlt, knowledge: FaStickyNote };
const TYPE_COLORS: Record<string, string> = { note: 'text-green-400 bg-green-500/10', bug: 'text-red-400 bg-red-500/10', commit: 'text-purple-400 bg-purple-500/10', deployment: 'text-blue-400 bg-blue-500/10', knowledge: 'text-green-400 bg-green-500/10' };

export function TaskLinks({ taskId, projectId }: Props) {
  const [links, setLinks] = useState<TaskLink[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [linkType, setLinkType] = useState<'note' | 'bug' | 'deployment' | 'knowledge'>('note');
  const [linkSearch, setLinkSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    database.getTaskLinks(taskId).then(setLinks);
  }, [taskId]);

  useEffect(() => {
    if (!linkSearch.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        let results: any[] = [];
        if (linkType === 'note') results = await database.searchNotes(linkSearch);
        else if (linkType === 'bug') results = await database.searchBugs(linkSearch);
        else if (linkType === 'deployment' && projectId) results = await database.getProjectDeployments(projectId);
        else if (linkType === 'knowledge') results = (await database.getNotes()).filter((n: any) => n.title.toLowerCase().includes(linkSearch.toLowerCase()));
        setSearchResults(results.slice(0, 5));
      } catch { setSearchResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [linkSearch, linkType, projectId]);

  const addLink = async (linkedId: number, linkedTitle: string) => {
    await database.addTaskLink(taskId, linkType, linkedId, linkedTitle);
    const updated = await database.getTaskLinks(taskId);
    setLinks(updated);
    setShowAdd(false);
    setLinkSearch('');
    setSearchResults([]);
    toast.success('Linked');
  };

  const removeLink = async (id: number) => {
    await database.removeTaskLink(id);
    setLinks(prev => prev.filter(l => l.id !== id));
    toast.success('Unlinked');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-theme-text/60 uppercase tracking-wider flex items-center gap-1.5">
          <FaLink className="w-3 h-3" /> Links ({links.length})
        </h4>
        <button onClick={() => setShowAdd(!showAdd)} className="text-[10px] text-theme-icon hover:text-theme-icon/80 transition-colors">
          <FaPlus className="w-3 h-3" />
        </button>
      </div>

      {showAdd && (
        <div className="bg-theme-surface border border-theme-border/20 rounded-lg p-3 space-y-2">
          <div className="flex gap-1.5">
            {(['note', 'bug', 'deployment', 'knowledge'] as const).map(t => {
              const Icon = TYPE_ICONS[t];
              return (
                <button key={t} onClick={() => { setLinkType(t); setLinkSearch(''); setSearchResults([]); }}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${linkType === t ? 'bg-theme-icon/10 text-theme-icon' : 'text-theme-text/40 hover:text-theme-text'}`}>
                  <Icon className="w-2.5 h-2.5" /> {t}
                </button>
              );
            })}
          </div>
          <input value={linkSearch} onChange={e => setLinkSearch(e.target.value)} placeholder="Search to link..." className="w-full bg-theme-background border border-theme-border/30 rounded-lg px-2.5 py-1.5 text-xs text-theme-text outline-none focus:border-theme-icon/50" />
          {searchResults.length > 0 && (
            <div className="space-y-1">
              {searchResults.map((r: any) => (
                <button key={r.id} onClick={() => addLink(r.id, r.title)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-theme-background/30 transition-colors text-left">
                  <FaPlus className="w-2.5 h-2.5 text-green-400 shrink-0" />
                  <span className="truncate text-theme-text">{r.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {links.length > 0 && (
        <div className="space-y-1">
          {links.map(link => {
            const Icon = TYPE_ICONS[link.linked_type] || FaLink;
            return (
              <div key={link.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs group hover:bg-theme-background/20 transition-colors">
                <div className={`w-5 h-5 rounded flex items-center justify-center ${TYPE_COLORS[link.linked_type] || 'bg-theme-background/30'}`}>
                  <Icon className="w-2.5 h-2.5" />
                </div>
                <span className="flex-1 truncate text-theme-text/70">{link.linked_title || `${link.linked_type} #${link.linked_id}`}</span>
                <span className="text-[9px] text-theme-text/30 uppercase">{link.linked_type}</span>
                <button onClick={() => removeLink(link.id)} className="opacity-0 group-hover:opacity-100 p-0.5 text-red-400 hover:text-red-300 transition-all">
                  <FaTrash className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
