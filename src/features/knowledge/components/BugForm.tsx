import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { Portal } from '../../../components/ui/overlays';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; problem: string; solution?: string; tags?: string; status?: string }) => void;
}

export function BugForm({ open, onClose, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState('open');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !problem.trim()) return;
    onSave({
      title: title.trim(),
      problem: problem.trim(),
      solution: solution.trim(),
      tags: JSON.stringify(tagsInput.split(',').map((t) => t.trim()).filter(Boolean)),
      status,
    });
    setTitle(''); setProblem(''); setSolution(''); setTagsInput('');
    onClose();
  };

  if (!open) return null;

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-[10%] md:left-1/2 md:-translate-x-1/2 z-50 w-full md:max-w-lg max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="bg-theme-surface border border-theme-border/30 rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-theme-text">Report Bug</h2>
                <button type="button" onClick={onClose}
                  className="p-2 rounded-lg text-theme-text/40 hover:text-theme-text hover:bg-theme-background/50 transition-colors">
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-theme-text mb-1">Title *</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
                      className="w-full px-3 py-2 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-theme-text mb-1">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text focus:outline-none focus:border-theme-icon/50">
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-text mb-1">Problem *</label>
                  <textarea value={problem} onChange={(e) => setProblem(e.target.value)} rows={4}
                    className="w-full px-3 py-2 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50 resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-text mb-1">Solution</label>
                  <textarea value={solution} onChange={(e) => setSolution(e.target.value)} rows={3}
                    className="w-full px-3 py-2 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50 resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-text mb-1">Tags (comma-separated)</label>
                  <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="e.g. frontend, api, critical"
                    className="w-full px-3 py-2 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-theme-border/10">
                <button type="button" onClick={onClose}
                  className="px-4 py-2 text-sm text-theme-text/60 hover:text-theme-text transition-colors">Cancel</button>
                <button type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-theme-error rounded-xl hover:opacity-90 transition-opacity">
                  Report Bug
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return <Portal>{content}</Portal>;
}
