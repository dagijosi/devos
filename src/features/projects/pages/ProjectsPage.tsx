import { useState, useCallback } from 'react';
import { FaPlus, FaSearch, FaTimes, FaFileImport } from 'react-icons/fa';
import { useProjects } from '../hooks/useProjects';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectForm } from '../components/ProjectForm';
import { ProjectScanner } from '../components/ProjectScanner';
import type { ProjectFormData } from '../types';

export function ProjectsPage() {
  const { projects, loading, createProject, deleteProject, toggleFavorite, togglePinned } = useProjects();
  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()))
    : projects;

  const handleSave = useCallback(async (data: ProjectFormData) => {
    await createProject(data);
    setShowForm(false);
  }, [createProject]);

  const handleImport = useCallback(async (data: ProjectFormData) => {
    await createProject(data);
  }, [createProject]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-text">Projects</h1>
          <p className="text-sm text-theme-text/60 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowScanner(!showScanner)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-theme-border/30 text-sm text-theme-text/60 hover:text-theme-text hover:border-theme-border/60 transition-colors">
            <FaFileImport className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-theme-icon rounded-xl hover:opacity-90 transition-opacity">
            <FaPlus className="w-3.5 h-3.5" />
            New Project
          </button>
        </div>
      </div>

      {showScanner && (
        <ProjectScanner onSelect={handleImport} onClose={() => setShowScanner(false)} />
      )}

      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text/30" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..."
          className="w-full pl-10 pr-10 py-2.5 bg-theme-surface border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text/30 hover:text-theme-text transition-colors">
            <FaTimes className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-theme-background/50" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-theme-background/50" />
                  <div className="h-3 w-1/2 rounded bg-theme-background/30" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FaSearch className="w-12 h-12 text-theme-text/20 mx-auto mb-4" />
          <p className="text-theme-text/40 text-sm">No projects found</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-sm text-theme-icon/70 hover:text-theme-icon transition-colors underline underline-offset-2">
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onToggleFavorite={toggleFavorite}
              onTogglePinned={togglePinned}
              onDelete={deleteProject}
            />
          ))}
        </div>
      )}

      <ProjectForm open={showForm} onClose={() => setShowForm(false)} onSave={handleSave} />
    </div>
  );
}
