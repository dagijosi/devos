import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaFolderOpen } from 'react-icons/fa';
import { Portal } from '../../../components/ui/overlays';
import type { Project, ProjectFormData } from '../types';

const isTauri = () => typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: ProjectFormData) => void;
  project?: Project | null;
}

export function ProjectForm({ open, onClose, onSave, project }: Props) {
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [tagsInput, setTagsInput] = useState(project?.tags.join(', ') ?? '');
  const [technologyInput, setTechnologyInput] = useState(project?.technology.join(', ') ?? '');
  const [repositoryUrl, setRepositoryUrl] = useState(project?.repository_url ?? '');
  const [localPath, setLocalPath] = useState(project?.local_path ?? '');
  const [status, setStatus] = useState<'active' | 'archived' | 'completed'>(project?.status ?? 'active');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Project name is required'); return; }
    setError('');
    onSave({
      name: name.trim(),
      description: description.trim(),
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      technology: technologyInput.split(',').map((t) => t.trim()).filter(Boolean),
      repository_url: repositoryUrl.trim(),
      local_path: localPath.trim(),
      status,
    });
  };

  if (!open) return null;

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-[10%] md:left-1/2 md:-translate-x-1/2 z-50 w-full md:max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <form onSubmit={handleSubmit} className="bg-theme-surface border border-theme-border/30 rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-theme-text">{project ? 'Edit Project' : 'New Project'}</h2>
                <button type="button" onClick={onClose} className="p-2 rounded-lg text-theme-text/40 hover:text-theme-text hover:bg-theme-background/50 transition-colors">
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              {error && <p className="text-sm text-red-400 mb-4 bg-red-500/10 px-3 py-2 rounded-xl">{error}</p>}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-1">Name *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} autoFocus
                    className="w-full px-3 py-2 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-text mb-1">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                    className="w-full px-3 py-2 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50 resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-text mb-1">Tags (comma-separated)</label>
                  <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="e.g. frontend, react, typescript"
                    className="w-full px-3 py-2 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-text mb-1">Technologies (comma-separated)</label>
                  <input value={technologyInput} onChange={(e) => setTechnologyInput(e.target.value)} placeholder="e.g. React, Node.js, TypeScript"
                    className="w-full px-3 py-2 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-theme-text mb-1">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}
                      className="w-full px-3 py-2 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text focus:outline-none focus:border-theme-icon/50">
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-theme-text mb-1">Repository URL</label>
                    <input value={repositoryUrl} onChange={(e) => setRepositoryUrl(e.target.value)} placeholder="https://github.com/..."
                      className="w-full px-3 py-2 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-text mb-1">Local Path</label>
                  <div className="flex gap-2">
                    <input value={localPath} onChange={(e) => setLocalPath(e.target.value)} placeholder="C:/Users/.../project"
                      className="flex-1 px-3 py-2 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50" />
                    <button type="button" onClick={async () => {
                      if (isTauri()) {
                        try {
                          const { open } = await import('@tauri-apps/plugin-dialog');
                          const selected = await open({ directory: true, multiple: false, title: 'Select Project Folder' });
                          if (selected) setLocalPath(selected);
                        } catch {}
                      }
                    }} className="p-2 rounded-xl bg-theme-background border border-theme-border/30 text-theme-text/40 hover:text-theme-icon transition-colors" title="Browse">
                      <FaFolderOpen className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-theme-border/10">
                <button type="button" onClick={onClose}
                  className="px-4 py-2 text-sm text-theme-text/60 hover:text-theme-text transition-colors">Cancel</button>
                <button type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-theme-icon rounded-xl hover:opacity-90 transition-opacity">
                  {project ? 'Save Changes' : 'Create Project'}
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
