import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaTrash, FaEdit, FaCheck, FaTimes, FaComment } from 'react-icons/fa';
import { database } from '../../../database';

interface ConversationSidebarProps {
  activeId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  onDelete: (id: number) => void;
  onRename: (id: number, title: string) => void;
}

export function ConversationSidebar({ activeId, onSelect, onNew, onDelete, onRename }: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const load = useCallback(async () => {
    const list = await database.getAiConversations();
    setConversations(list);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRename = async () => {
    if (editingId !== null && editTitle.trim()) {
      await onRename(editingId, editTitle.trim());
      setEditingId(null);
      load();
    }
  };

  return (
    <div className="w-64 border-r border-theme-border/20 flex flex-col h-full bg-theme-surface/30">
      <div className="p-3 border-b border-theme-border/20">
        <button
          onClick={() => { onNew(); }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors"
        >
          <FaPlus className="w-3 h-3" /> New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-sm transition-colors ${
              activeId === conv.id
                ? 'bg-theme-icon/10 text-theme-text'
                : 'text-theme-text/60 hover:bg-theme-surface hover:text-theme-text/80'
            }`}
            onClick={() => onSelect(conv.id)}
          >
            <FaComment className="w-3 h-3 flex-shrink-0 opacity-50" />
            {editingId === conv.id ? (
              <div className="flex-1 flex items-center gap-1">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditingId(null); }}
                  className="flex-1 bg-theme-background border border-theme-border/30 rounded px-1.5 py-0.5 text-xs outline-none"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <button onClick={(e) => { e.stopPropagation(); handleRename(); }} className="p-0.5 text-green-400"><FaCheck className="w-2.5 h-2.5" /></button>
                <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="p-0.5 text-theme-text/40"><FaTimes className="w-2.5 h-2.5" /></button>
              </div>
            ) : (
              <>
                <span className="flex-1 truncate text-xs">{conv.title}</span>
                <div className="hidden group-hover:flex items-center gap-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingId(conv.id); setEditTitle(conv.title); }}
                    className="p-1 rounded hover:bg-theme-border/20 text-theme-text/40 hover:text-theme-text/70"
                  >
                    <FaEdit className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                    className="p-1 rounded hover:bg-red-500/10 text-theme-text/40 hover:text-red-400"
                  >
                    <FaTrash className="w-2.5 h-2.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {conversations.length === 0 && (
          <p className="text-xs text-theme-text/30 text-center py-8">No conversations yet</p>
        )}
      </div>
    </div>
  );
}
