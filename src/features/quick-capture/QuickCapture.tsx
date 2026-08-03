import { useState, useEffect, useRef } from 'react';
import { FaTimes, FaPlus, FaBug, FaStickyNote, FaCode, FaTasks, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'sonner';
import { useActiveProjectStore } from '../../stores/activeProject.store';
import { database } from '../../database';

type CaptureType = 'task' | 'note' | 'bug' | 'snippet';

interface Props {
  onClose: () => void;
  onCreated?: () => void;
}

const TYPE_CONFIG: Record<CaptureType, { label: string; icon: React.ElementType; color: string }> = {
  task: { label: 'Task', icon: FaTasks, color: 'text-blue-400 bg-blue-500/10' },
  note: { label: 'Note', icon: FaStickyNote, color: 'text-green-400 bg-green-500/10' },
  bug: { label: 'Bug', icon: FaBug, color: 'text-red-400 bg-red-500/10' },
  snippet: { label: 'Snippet', icon: FaCode, color: 'text-purple-400 bg-purple-500/10' },
};

export function QuickCapture({ onClose, onCreated }: Props) {
  const { activeProject } = useActiveProjectStore();
  const [type, setType] = useState<CaptureType>('task');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    if ((type === 'task' || type === 'bug') && !activeProject) {
      toast.error('Select a project first, or use Library for notes/snippets');
      return;
    }
    setSaving(true);
    try {
      const projectId = activeProject?.id;
      if (type === 'task') {
        if (!projectId) { toast.error('Tasks require an active project'); setSaving(false); return; }
        await database.addProjectTask(projectId, title.trim(), priority, dueDate || undefined);
      } else if (type === 'note') {
        await database.createNote({ title: title.trim(), content: description, project_id: projectId || null });
      } else if (type === 'bug') {
        await database.createBug({ title: title.trim(), problem: description, project_id: projectId || null });
      } else if (type === 'snippet') {
        await database.createSnippet({ title: title.trim(), code: description, language: 'text', project_id: projectId || null });
      }
      toast.success(`${TYPE_CONFIG[type].label} created`);
      onCreated?.();
      onClose();
    } catch (e) {
      toast.error(`Failed to create ${TYPE_CONFIG[type].label}`);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-theme-surface border border-theme-border/20 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-theme-border/10">
          <div className="flex items-center gap-2">
            <FaPlus className="w-3.5 h-3.5 text-theme-icon" />
            <span className="text-sm font-medium text-theme-text">Quick Capture</span>
            {activeProject && (
              <span className="text-[10px] text-theme-text/40 bg-theme-background/50 rounded px-2 py-0.5">{activeProject.name}</span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded text-theme-text/40 hover:text-theme-text hover:bg-theme-background/30 transition-colors">
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-1.5">
            {(Object.entries(TYPE_CONFIG) as [CaptureType, typeof TYPE_CONFIG[CaptureType]][]).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    type === key ? cfg.color + ' ring-1 ring-current' : 'text-theme-text/40 bg-theme-background/30 hover:text-theme-text/70'
                  }`}
                >
                  <Icon className="w-3 h-3" /> {cfg.label}
                </button>
              );
            })}
          </div>

          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === 'task' ? 'What needs to be done?' : type === 'note' ? 'Note title...' : type === 'bug' ? 'Bug description...' : 'Snippet name...'}
            className="w-full bg-theme-background/50 border border-theme-border/20 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/30 outline-none focus:border-theme-icon/40"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          />

          {(type === 'task' || type === 'bug') && !activeProject && (
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-400">
              <FaExclamationTriangle className="w-3 h-3 shrink-0" />
              <span>No active project — switch or create one first</span>
            </div>
          )}

          {type === 'task' && (
            <div className="flex gap-3">
              <select value={priority} onChange={(e) => setPriority(e.target.value)}
                className="flex-1 bg-theme-background/50 border border-theme-border/20 rounded-lg px-3 py-1.5 text-xs text-theme-text outline-none">
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
              </select>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="flex-1 bg-theme-background/50 border border-theme-border/20 rounded-lg px-3 py-1.5 text-xs text-theme-text outline-none" />
            </div>
          )}

          {type !== 'task' && (
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'note' ? 'Start writing...' : type === 'bug' ? 'Steps to reproduce...' : 'Paste code...'}
              className="w-full bg-theme-background/50 border border-theme-border/20 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/30 outline-none focus:border-theme-icon/40 resize-none h-24" />
          )}

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs text-theme-text/50 hover:text-theme-text transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-theme-icon text-white rounded-lg hover:bg-theme-icon/90 transition-colors disabled:opacity-40"
            >
              {saving ? 'Saving...' : `Create ${TYPE_CONFIG[type].label}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
