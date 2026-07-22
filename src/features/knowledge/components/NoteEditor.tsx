import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaSave, FaClock } from 'react-icons/fa';
import type { Note } from '../types';

interface Props {
  note: Note | null;
  onSave: (id: number, data: Partial<Note>) => void;
}

export function NoteEditor({ note, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTitle(note?.title ?? '');
    setContent(note?.content ?? '');
    setDirty(false);
  }, [note?.id]);

  const doSave = useCallback(async () => {
    if (!note || !dirty) return;
    setSaving(true);
    await onSave(note.id, { title, content });
    setDirty(false);
    setLastSaved(new Date());
    setSaving(false);
  }, [note, dirty, title, content, onSave]);

  useEffect(() => {
    if (!dirty) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSave, 2000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [dirty, doSave]);

  const handleTitleChange = (val: string) => { setTitle(val); setDirty(true); };
  const handleContentChange = (val: string) => { setContent(val); setDirty(true); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); doSave(); }
  };

  if (!note) {
    return (
      <div className="flex items-center justify-center h-full text-theme-text/30 text-sm py-20">
        Select a note to edit
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between mb-3">
        <input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Note title..."
          className="flex-1 text-lg font-bold text-theme-text bg-transparent border-none outline-none placeholder-theme-text/30" />
        <div className="flex items-center gap-2 text-[10px] text-theme-text/30">
          {dirty && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1"><FaClock className="w-2.5 h-2.5" />Unsaved</motion.span>}
          {saving && <span className="flex items-center gap-1"><FaSave className="w-2.5 h-2.5" />Saving...</span>}
          {lastSaved && !dirty && <span>Saved {lastSaved.toLocaleTimeString()}</span>}
        </div>
      </div>

      <textarea value={content} onChange={(e) => handleContentChange(e.target.value)} placeholder="Start writing in Markdown..."
        className="flex-1 w-full bg-theme-background/30 border border-theme-border/20 rounded-xl p-4 text-sm text-theme-text placeholder-theme-text/30 resize-none focus:outline-none focus:border-theme-icon/50 font-mono leading-relaxed"
        spellCheck={false} />

      <div className="flex items-center gap-2 mt-2 text-[10px] text-theme-text/30">
        <span>Markdown supported</span>
        <span>·</span>
        <span>Ctrl+S to save</span>
        <span>·</span>
        <span>Autosaves every 2s</span>
      </div>
    </div>
  );
}
