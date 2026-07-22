import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { SNIPPET_LANGUAGES } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; code: string; language: string; description?: string; tags?: string }) => void;
}

export function SnippetForm({ open, onClose, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) return;
    onSave({ title: title.trim(), code, language, description: description.trim(), tags: JSON.stringify([language]) });
    setTitle(''); setCode(''); setDescription('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-[5%] md:left-1/2 md:-translate-x-1/2 z-50 w-full md:max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="bg-theme-surface border border-theme-border/30 rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-theme-text">New Code Snippet</h2>
                <button type="button" onClick={onClose}
                  className="p-2 rounded-lg text-theme-text/40 hover:text-theme-text hover:bg-theme-background/50 transition-colors">
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-theme-text mb-1">Title</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
                      className="w-full px-3 py-2 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-theme-text mb-1">Language</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3 py-2 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text focus:outline-none focus:border-theme-icon/50">
                      {SNIPPET_LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.icon} {l.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-text mb-1">Code</label>
                  <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={10}
                    className="w-full px-3 py-2 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50 font-mono resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-text mb-1">Description</label>
                  <input value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-theme-border/10">
                <button type="button" onClick={onClose}
                  className="px-4 py-2 text-sm text-theme-text/60 hover:text-theme-text transition-colors">Cancel</button>
                <button type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl hover:opacity-90 transition-opacity">
                  Save Snippet
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
