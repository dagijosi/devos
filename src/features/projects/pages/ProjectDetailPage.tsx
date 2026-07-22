import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaFolder, FaStar, FaRegStar, FaThumbtack, FaTrash, FaEdit, FaCalendarAlt, FaMapMarkerAlt, FaLink, FaTerminal } from 'react-icons/fa';
import { useProjects } from '../hooks/useProjects';
import { ProjectActions } from '../components/ProjectActions';
import { TechnologyBadge } from '../components/TechnologyBadge';
import { ProjectForm } from '../components/ProjectForm';
import type { Project, ProjectFormData } from '../types';
import { PROJECTS } from '../../../routes/types/routeConstants';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProject, updateProject, deleteProject, toggleFavorite, togglePinned, updateLastOpened, refresh } = useProjects();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const data = await getProject(Number(id));
    setProject(data);
    setLoading(false);
  }, [id, getProject]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async (data: ProjectFormData) => {
    if (!project) return;
    await updateProject(project.id, data);
    setEditing(false);
    load();
    refresh();
  };

  const handleDelete = async () => {
    if (!project) return;
    await deleteProject(project.id);
    navigate(PROJECTS);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-theme-background/50" />
        <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-8">
          <div className="space-y-4">
            <div className="h-6 w-1/3 rounded bg-theme-background/50" />
            <div className="h-4 w-2/3 rounded bg-theme-background/30" />
            <div className="h-4 w-1/2 rounded bg-theme-background/30" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16 max-w-4xl mx-auto">
        <FaFolder className="w-16 h-16 text-theme-text/20 mx-auto mb-4" />
        <p className="text-lg text-theme-text/40">Project not found</p>
        <button onClick={() => navigate(PROJECTS)} className="mt-4 text-sm text-theme-icon/70 hover:text-theme-icon underline underline-offset-2">
          Back to projects
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate(PROJECTS)} className="flex items-center gap-2 text-sm text-theme-text/50 hover:text-theme-text transition-colors">
        <FaArrowLeft className="w-3.5 h-3.5" />
        Back to Projects
      </button>

      <div className="bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent border border-theme-border/30 rounded-2xl p-6 md:p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <FaFolder className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-theme-text truncate">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-theme-text/60 mt-1">{project.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                  project.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                  project.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                  'bg-gray-500/10 text-gray-400 border border-gray-500/30'
                }`}>{project.status}</span>
                {project.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-theme-background/50 text-theme-text/50 border border-theme-border/20">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => { toggleFavorite(project.id); setProject({ ...project, favorite: !project.favorite }); }}
              className={`p-2 rounded-lg transition-colors ${project.favorite ? 'text-yellow-400 bg-yellow-400/10' : 'text-theme-text/30 hover:text-yellow-400 hover:bg-yellow-400/10'}`} title="Favorite">
              {project.favorite ? <FaStar className="w-4 h-4" /> : <FaRegStar className="w-4 h-4" />}
            </button>
            <button onClick={() => { togglePinned(project.id); setProject({ ...project, pinned: !project.pinned }); }}
              className={`p-2 rounded-lg transition-colors ${project.pinned ? 'text-yellow-400 bg-yellow-400/10' : 'text-theme-text/30 hover:text-yellow-400 hover:bg-yellow-400/10'}`} title="Pin">
              <FaThumbtack className="w-4 h-4" />
            </button>
            <button onClick={() => setEditing(true)}
              className="p-2 rounded-lg text-theme-text/30 hover:text-blue-400 hover:bg-blue-400/10 transition-colors" title="Edit">
              <FaEdit className="w-4 h-4" />
            </button>
            <button onClick={handleDelete}
              className="p-2 rounded-lg text-theme-text/30 hover:text-red-400 hover:bg-red-400/10 transition-colors" title="Delete">
              <FaTrash className="w-4 h-4" />
            </button>
          </div>
        </div>

        {project.technology.length > 0 && (
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {project.technology.map((t) => <TechnologyBadge key={t} name={t} size="md" />)}
          </div>
        )}
      </div>

      <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-theme-text mb-3">Quick Actions</h2>
        <ProjectActions project={project} onOpen={updateLastOpened} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-theme-text mb-4">Details</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <FaCalendarAlt className="w-4 h-4 text-theme-text/30" />
              <span className="text-theme-text/50">Created:</span>
              <span className="text-theme-text ml-auto">{new Date(project.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <FaCalendarAlt className="w-4 h-4 text-theme-text/30" />
              <span className="text-theme-text/50">Updated:</span>
              <span className="text-theme-text ml-auto">{new Date(project.updated_at).toLocaleDateString()}</span>
            </div>
            {project.last_opened && (
              <div className="flex items-center gap-3 text-sm">
                <FaFolder className="w-4 h-4 text-theme-text/30" />
                <span className="text-theme-text/50">Last opened:</span>
                <span className="text-theme-text ml-auto">{new Date(project.last_opened).toLocaleDateString()}</span>
              </div>
            )}
            {project.local_path && (
              <div className="flex items-center gap-3 text-sm">
                <FaMapMarkerAlt className="w-4 h-4 text-theme-text/30" />
                <span className="text-theme-text/50">Path:</span>
                <span className="text-theme-text ml-auto text-xs truncate max-w-[200px]" title={project.local_path}>{project.local_path}</span>
              </div>
            )}
            {project.repository_url && (
              <div className="flex items-center gap-3 text-sm">
                <FaLink className="w-4 h-4 text-theme-text/30" />
                <span className="text-theme-text/50">Repo:</span>
                <a href={project.repository_url} target="_blank" rel="noreferrer"
                  className="text-blue-400 hover:underline ml-auto text-xs truncate max-w-[200px]">{project.repository_url}</a>
              </div>
            )}
          </div>
        </div>

        <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-theme-text mb-4">Scripts</h2>
          {Object.keys(project.scripts).length === 0 ? (
            <p className="text-sm text-theme-text/40">No scripts defined</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(project.scripts).map(([name, cmd], i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-theme-background/30 border border-theme-border/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <FaTerminal className="w-3.5 h-3.5 text-theme-text/30 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-theme-text truncate">{name}</p>
                      <p className="text-[11px] text-theme-text/40 truncate">{cmd}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ProjectForm open={editing} onClose={() => setEditing(false)} onSave={handleUpdate} project={project} />
    </div>
  );
}
