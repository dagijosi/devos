import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaFolderOpen, FaTimes } from 'react-icons/fa';
import { useProjects } from '../hooks/useProjects';
import { PROJECTS } from '../../../routes/types/routeConstants';
import type { Project, ProjectFormData } from '../types';

export function ProjectFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { getProject, createProject, updateProject } = useProjects();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [technologyInput, setTechnologyInput] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [localPath, setLocalPath] = useState('');
  const [status, setStatus] = useState<'active' | 'archived' | 'completed'>('active');
  const [scripts, setScripts] = useState<Record<string, string>>({});
  const [scriptName, setScriptName] = useState('');
  const [scriptCommand, setScriptCommand] = useState('');
  const [environment, setEnvironment] = useState<Record<string, string>>({});
  const [envKey, setEnvKey] = useState('');
  const [envValue, setEnvValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadProject();
    } else if (location.state) {
      const state = location.state as Partial<ProjectFormData>;
      setName(state.name || '');
      setDescription(state.description || '');
      setTags(state.tags || []);
      setTechnologies(state.technology || []);
      setRepositoryUrl(state.repository_url || '');
      setLocalPath(state.local_path || '');
      setStatus(state.status || 'active');
      setScripts(state.scripts || {});
      setEnvironment(state.environment || {});
    }
  }, [id, location.state]);

  const loadProject = async () => {
    if (!id) return;
    setLoading(true);
    const data = await getProject(Number(id));
    if (data) {
      setProject(data);
      setName(data.name);
      setDescription(data.description);
      setTags(data.tags);
      setTechnologies(data.technology);
      setRepositoryUrl(data.repository_url);
      setLocalPath(data.local_path);
      setStatus(data.status);
      setScripts(data.scripts);
      setEnvironment(data.environment);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Project name is required'); return; }
    setError('');

    const formData: ProjectFormData = {
      name: name.trim(),
      description: description.trim(),
      tags,
      technology: technologies,
      repository_url: repositoryUrl.trim(),
      local_path: localPath.trim(),
      status,
      scripts,
      environment,
    };

    if (id && project) {
      await updateProject(project.id, formData);
    } else {
      await createProject(formData);
    }

    navigate(PROJECTS);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const addTechnology = () => {
    if (technologyInput.trim() && !technologies.includes(technologyInput.trim())) {
      setTechnologies([...technologies, technologyInput.trim()]);
      setTechnologyInput('');
    }
  };

  const removeTechnology = (techToRemove: string) => {
    setTechnologies(technologies.filter((tech) => tech !== techToRemove));
  };

  const addScript = () => {
    if (scriptName.trim() && scriptCommand.trim()) {
      setScripts({ ...scripts, [scriptName.trim()]: scriptCommand.trim() });
      setScriptName('');
      setScriptCommand('');
    }
  };

  const removeScript = (scriptNameToRemove: string) => {
    const newScripts = { ...scripts };
    delete newScripts[scriptNameToRemove];
    setScripts(newScripts);
  };

  const addEnvironment = () => {
    if (envKey.trim() && envValue.trim()) {
      setEnvironment({ ...environment, [envKey.trim()]: envValue.trim() });
      setEnvKey('');
      setEnvValue('');
    }
  };

  const removeEnvironment = (envKeyToRemove: string) => {
    const newEnv = { ...environment };
    delete newEnv[envKeyToRemove];
    setEnvironment(newEnv);
  };

  if (loading) {
    return (
      <div className="w-full py-8 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-theme-background/50 mb-6" />
        <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-8 space-y-4">
          <div className="h-6 w-1/3 rounded bg-theme-background/50" />
          <div className="h-4 w-2/3 rounded bg-theme-background/30" />
          <div className="h-4 w-1/2 rounded bg-theme-background/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-6 px-4">
      <button onClick={() => navigate(PROJECTS)} className="flex items-center gap-2 text-sm text-theme-text/50 hover:text-theme-text transition-colors mb-6">
        <FaArrowLeft className="w-3.5 h-3.5" />
        Back to Projects
      </button>

      <h1 className="text-xl font-bold text-theme-text mb-6">{project ? 'Edit Project' : 'New Project'}</h1>

      {error && <p className="text-sm text-red-400 mb-6 bg-red-500/10 px-4 py-3 rounded-xl">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-theme-text mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-theme-text mb-2">Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} autoFocus
                className="w-full px-4 py-3 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-text mb-2">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                className="w-full px-4 py-3 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50 resize-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-theme-text mb-4">Classification</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add a tag..."
                    className="flex-1 px-4 py-3 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <button type="button" onClick={addTag}
                    className="px-4 py-3 text-sm font-medium text-white bg-theme-icon rounded-xl hover:opacity-90 transition-opacity">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full bg-theme-background/50 text-theme-text border border-theme-border/20">
                      #{tag}
                      <button type="button" onClick={() => removeTag(tag)} className="text-theme-text/40 hover:text-theme-text transition-colors">
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">Technologies</label>
                <div className="flex gap-2 mb-2">
                  <input value={technologyInput} onChange={(e) => setTechnologyInput(e.target.value)} placeholder="Add a technology..."
                    className="flex-1 px-4 py-3 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                  />
                  <button type="button" onClick={addTechnology}
                    className="px-4 py-3 text-sm font-medium text-white bg-theme-icon rounded-xl hover:opacity-90 transition-opacity">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {technologies.map((tech) => (
                    <span key={tech} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                      {tech}
                      <button type="button" onClick={() => removeTechnology(tech)} className="text-blue-400/60 hover:text-blue-400 transition-colors">
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-theme-text mb-4">Status & Repository</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}
                  className="w-full px-4 py-3 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text focus:outline-none focus:border-theme-icon/50">
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">Repository URL</label>
                <input value={repositoryUrl} onChange={(e) => setRepositoryUrl(e.target.value)} placeholder="https://github.com/..."
                  className="w-full px-4 py-3 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-theme-text mb-4">Location</h2>
          <div className="flex gap-2">
            <input value={localPath} onChange={(e) => setLocalPath(e.target.value)} placeholder="C:/Users/.../project"
              className="flex-1 px-4 py-3 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50" />
            <button type="button" className="p-3 rounded-xl bg-theme-background border border-theme-border/30 text-theme-text/40 hover:text-theme-icon transition-colors" title="Browse">
              <FaFolderOpen className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-theme-text mb-4">Scripts</h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input value={scriptName} onChange={(e) => setScriptName(e.target.value)} placeholder="Script name..."
                  className="flex-1 px-3 py-2 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50" />
                <input value={scriptCommand} onChange={(e) => setScriptCommand(e.target.value)} placeholder="Command..."
                  className="flex-1 px-3 py-2 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50" />
                <button type="button" onClick={addScript}
                  className="px-3 py-2 text-sm font-medium text-white bg-theme-icon rounded-xl hover:opacity-90 transition-opacity">
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {Object.entries(scripts).map(([name, cmd]) => (
                  <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-theme-background/30 border border-theme-border/10">
                    <div className="min-w-0">
                      <p className="text-sm text-theme-text font-medium">{name}</p>
                      <p className="text-[11px] text-theme-text/40 truncate">{cmd}</p>
                    </div>
                    <button type="button" onClick={() => removeScript(name)} className="text-theme-text/40 hover:text-red-400 transition-colors ml-2">
                      <FaTimes className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-theme-text mb-4">Environment Variables</h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input value={envKey} onChange={(e) => setEnvKey(e.target.value)} placeholder="Key..."
                  className="flex-1 px-3 py-2 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50" />
                <input value={envValue} onChange={(e) => setEnvValue(e.target.value)} placeholder="Value..."
                  className="flex-1 px-3 py-2 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50" />
                <button type="button" onClick={addEnvironment}
                  className="px-3 py-2 text-sm font-medium text-white bg-theme-icon rounded-xl hover:opacity-90 transition-opacity">
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {Object.entries(environment).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-theme-background/30 border border-theme-border/10">
                    <div className="min-w-0">
                      <p className="text-sm text-theme-text font-medium">{key}</p>
                      <p className="text-[11px] text-theme-text/40 truncate">{value}</p>
                    </div>
                    <button type="button" onClick={() => removeEnvironment(key)} className="text-theme-text/40 hover:text-red-400 transition-colors ml-2">
                      <FaTimes className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(PROJECTS)}
            className="px-6 py-3 text-sm text-theme-text/60 hover:text-theme-text transition-colors">Cancel</button>
          <button type="submit"
            className="px-6 py-3 text-sm font-medium text-white bg-theme-icon rounded-xl hover:opacity-90 transition-opacity">
            {project ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
}
