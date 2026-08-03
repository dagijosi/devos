import { useState } from 'react';
import { FaSave, FaTrash, FaExclamationTriangle, FaFolder, FaGithub, FaBell, FaTag, FaTimes } from 'react-icons/fa';
import { NotificationRules } from '../../../notifications/NotificationRules';
import { TeamSyncSettings } from '../../../team-sync/TeamSyncSettings';

const isTauri = () => typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { database } from '../../../../database';
import type { Project, ProjectFormData } from '../../types';
import { PROJECTS } from '../../../../routes/types/routeConstants';
import { PROJECT_MODULES, PROJECT_MODULE_LABELS, DEFAULT_ENABLED_MODULES } from '../../projectModules';

interface SettingsTabProps {
  project: Project;
  onRefresh: () => void;
}

const parseTags = (tags: unknown): string[] => {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') { try { return JSON.parse(tags); } catch { return []; } }
  return [];
};

export function SettingsTab({ project, onRefresh }: SettingsTabProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState<ProjectFormData>({
    name: project.name,
    description: project.description,
    status: project.status,
    icon: project.icon,
    color: project.color,
    category: project.category,
    tags: parseTags(project.tags),
    technology: project.technology,
    repository_url: project.repository_url,
    local_path: project.local_path,
    scripts: project.scripts,
    environment: project.environment,
    enabled_modules: project.enabled_modules ?? DEFAULT_ENABLED_MODULES,
  });
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) updateForm('tags', [...form.tags, t]);
    setTagInput('');
  };

  const removeTag = (t: string) => updateForm('tags', form.tags.filter(x => x !== t));

  const toggleModule = (m: (typeof PROJECT_MODULES)[number]) => {
    const current = form.enabled_modules ?? DEFAULT_ENABLED_MODULES;
    updateForm('enabled_modules', current.includes(m) ? current.filter(x => x !== m) : [...current, m]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await database.updateProject(project.id, form as any);
      if (project.id) await database.addProjectActivity(project.id, 'Project settings updated', 'update');
      toast.success('Project updated');
      onRefresh();
    } catch (e) {
      toast.error('Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await database.deleteProject(project.id);
      toast.success('Project deleted');
      navigate(PROJECTS);
    } catch (e) {
      toast.error('Failed to delete project');
    }
  };

  const updateForm = (field: keyof ProjectFormData, value: any) => setForm({ ...form, [field]: value });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-theme-text mb-1">General</h3>
        <p className="text-xs text-theme-text/40 mb-4">Edit your project's basic information</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-theme-text/60 mb-1 block">Name</label>
            <input type="text" value={form.name} onChange={e => updateForm('name', e.target.value)}
              className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text outline-none focus:border-theme-icon/50" />
          </div>
          <div>
            <label className="text-xs text-theme-text/60 mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => updateForm('description', e.target.value)} rows={3}
              className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text outline-none focus:border-theme-icon/50 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-theme-text/60 mb-1 block">Status</label>
              <select value={form.status} onChange={e => updateForm('status', e.target.value)}
                className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text outline-none focus:border-theme-icon/50">
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-theme-text/60 mb-1 block">Category</label>
              <select value={form.category} onChange={e => updateForm('category', e.target.value)}
                className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text outline-none focus:border-theme-icon/50">
                <option value="">General</option>
                <option value="web">Web App</option>
                <option value="mobile">Mobile</option>
                <option value="backend">Backend</option>
                <option value="desktop">Desktop</option>
                <option value="library">Library</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-theme-text/60 mb-1 block flex items-center gap-1"><FaTag className="w-3 h-3" /> Tags</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add a tag..."
                className="flex-1 bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2 text-xs text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
              <button onClick={addTag}
                className="px-3 py-2 text-xs font-medium bg-theme-icon/10 text-theme-icon rounded-xl hover:bg-theme-icon/20 transition-colors">Add</button>
            </div>
            {form.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map(t => (
                  <span key={t} className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-theme-border/10 text-theme-text/50 rounded">
                    {t}
                    <button onClick={() => removeTag(t)} className="hover:text-red-400"><FaTimes className="w-2.5 h-2.5" /></button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-theme-text/30 italic">No tags — add one above</p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-theme-border/10 pt-6">
        <h3 className="text-sm font-semibold text-theme-text mb-1">Paths & Links</h3>
        <p className="text-xs text-theme-text/40 mb-4">Configure project locations and external links</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-theme-text/60 mb-1 block flex items-center gap-1"><FaFolder className="w-3 h-3" /> Local Path</label>
            <div className="flex gap-2">
              <input type="text" value={form.local_path} onChange={e => updateForm('local_path', e.target.value)}
                placeholder="C:\Projects\my-app" className="flex-1 bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text outline-none focus:border-theme-icon/50" />
              <button type="button" onClick={async () => {
                if (isTauri()) {
                  try {
                    const { open } = await import('@tauri-apps/plugin-dialog');
                    const selected = await open({ directory: true, multiple: false, title: 'Select Project Folder' });
                    if (selected) updateForm('local_path', selected);
                  } catch {}
                }
              }} className="px-3 py-2 bg-theme-background border border-theme-border/30 rounded-xl text-theme-text/40 hover:text-theme-icon transition-colors" title="Browse">
                <FaFolder className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-theme-text/60 mb-1 block flex items-center gap-1"><FaGithub className="w-3 h-3" /> Repository URL</label>
            <input type="text" value={form.repository_url} onChange={e => updateForm('repository_url', e.target.value)}
              placeholder="https://github.com/user/repo" className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text outline-none focus:border-theme-icon/50" />
          </div>
        </div>
      </div>

      <div className="border-t border-theme-border/10 pt-6">
        <h3 className="text-sm font-semibold text-theme-text mb-1">Modules</h3>
        <p className="text-xs text-theme-text/40 mb-4">Choose which sections appear in this project's hub</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PROJECT_MODULES.map((m) => {
            const enabled = (form.enabled_modules ?? DEFAULT_ENABLED_MODULES).includes(m);
            return (
              <button
                key={m}
                onClick={() => toggleModule(m)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                  enabled
                    ? 'bg-theme-icon/10 border-theme-icon/40 text-theme-icon'
                    : 'bg-theme-background border-theme-border/30 text-theme-text/40 hover:text-theme-text/70'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-theme-icon' : 'bg-theme-text/20'}`} />
                {PROJECT_MODULE_LABELS[m]}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-theme-text/30 mt-2">Overview and Settings are always shown.</p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-theme-border/10">
        <button
          onClick={() => setShowDelete(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-colors"
        >
          <FaTrash className="w-3 h-3" /> Delete Project
        </button>
        <button
          onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 disabled:opacity-50 transition-colors"
        >
          <FaSave className="w-3 h-3" /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {showDelete && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-red-400">Delete Project</h4>
              <p className="text-xs text-theme-text/50">This will permanently delete "{project.name}" and all associated data.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors">Yes, Delete</button>
            <button onClick={() => setShowDelete(false)} className="px-4 py-2 bg-theme-surface border border-theme-border/30 text-theme-text rounded-xl text-sm hover:bg-theme-surface/80 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Notification Rules */}
      <div className="pt-6 border-t border-theme-border/10">
        <div className="flex items-center gap-2 mb-4">
          <FaBell className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-semibold text-theme-text">Notifications</h3>
        </div>
        <NotificationRules />
      </div>

      {/* Team Sync */}
      <div className="pt-6 border-t border-theme-border/10">
        <TeamSyncSettings />
      </div>
    </div>
  );
}
