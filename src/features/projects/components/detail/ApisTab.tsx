import { useState, useEffect } from 'react';
import { FaPlus, FaLink, FaTrash, FaExternalLinkAlt, FaGlobe } from 'react-icons/fa';
import { database } from '../../../../database';

export function ApisTab({ projectId }: { projectId: number }) {
  const [links, setLinks] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [url, setUrl] = useState('');
  const [type, setType] = useState('api');

  useEffect(() => {
    database.getProjectLinks(projectId).then(setLinks);
  }, [projectId]);

  const addLink = async () => {
    if (!url.trim()) return;
    await database.addProjectLink(projectId, type, url.trim());
    setLinks(await database.getProjectLinks(projectId));
    setUrl('');
    setShowAdd(false);
  };

  const deleteLink = async (id: number) => {
    await database.deleteProjectLink(id);
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-theme-text/40">{links.length} link{links.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-xs text-theme-icon hover:text-theme-icon/80 transition-colors">
          <FaPlus className="w-2.5 h-2.5" /> Add Link
        </button>
      </div>

      {showAdd && (
        <div className="flex items-center gap-2 mb-4 p-4 bg-theme-background rounded-xl border border-theme-border/20">
          <select value={type} onChange={e => setType(e.target.value)}
            className="bg-theme-surface border border-theme-border/30 rounded-lg px-3 py-2 text-xs text-theme-text outline-none">
            <option value="api">API</option>
            <option value="docs">Documentation</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
            <option value="other">Other</option>
          </select>
          <input type="text" value={url} onChange={e => setUrl(e.target.value)}
            placeholder="https://api.example.com" autoFocus
            className="flex-1 bg-theme-surface border border-theme-border/30 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50"
            onKeyDown={e => { if (e.key === 'Enter') addLink(); if (e.key === 'Escape') setShowAdd(false); }} />
          <button onClick={addLink} className="px-3 py-2 bg-theme-icon text-white rounded-lg text-xs font-medium">Add</button>
        </div>
      )}

      {links.length === 0 && !showAdd ? (
        <div className="text-center py-8">
          <FaGlobe className="w-8 h-8 text-theme-text/20 mx-auto mb-2" />
          <p className="text-xs text-theme-text/40">No API links added yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map(link => (
            <div key={link.id} className="flex items-center gap-3 p-3 bg-theme-surface border border-theme-border/20 rounded-xl hover:border-theme-border/40 transition-colors group">
              <FaLink className="w-3.5 h-3.5 text-theme-text/30 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-theme-text capitalize">{link.type}</p>
                <p className="text-[10px] text-theme-text/40 font-mono truncate">{link.url}</p>
              </div>
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-theme-text/30 hover:text-theme-icon opacity-0 group-hover:opacity-100 transition-all">
                <FaExternalLinkAlt className="w-3 h-3" />
              </a>
              <button onClick={() => deleteLink(link.id)} className="p-1.5 rounded-lg text-theme-text/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                <FaTrash className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
