import { useState, useEffect, useCallback } from 'react';
import { database } from '../../../database';
import type { Project, ProjectFormData } from '../types';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await database.getProjects();
    setProjects(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const getProject = useCallback(async (id: number): Promise<Project | null> => {
    return database.getProject(id);
  }, []);

  const createProject = useCallback(async (data: ProjectFormData): Promise<Project | null> => {
    const created = await database.createProject({
      name: data.name,
      description: data.description,
      tags: JSON.stringify(data.tags),
      repository_url: data.repository_url,
      local_path: data.local_path,
    });
    if (created) {
      await database.addActivity('project', created.id, 'created', `Project "${created.name}" created`);
      setProjects((prev) => [created, ...prev]);
    }
    return created;
  }, []);

  const updateProject = useCallback(async (id: number, data: Partial<ProjectFormData & { status: string }>): Promise<void> => {
    await database.updateProject(id, data as Partial<Project>);
    await database.addActivity('project', id, 'updated', `Project updated`);
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p)));
  }, []);

  const deleteProject = useCallback(async (id: number): Promise<void> => {
    const project = projects.find((p) => p.id === id);
    await database.deleteProject(id);
    if (project) {
      await database.addActivity('project', id, 'deleted', `Project "${project.name}" deleted`);
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, [projects]);

  const toggleFavorite = useCallback(async (id: number): Promise<void> => {
    await database.toggleFavorite(id);
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, favorite: !p.favorite, updated_at: new Date().toISOString() } : p))
    );
  }, []);

  const togglePinned = useCallback(async (id: number): Promise<void> => {
    await database.togglePinned(id);
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, pinned: !p.pinned, updated_at: new Date().toISOString() } : p))
    );
  }, []);

  const updateLastOpened = useCallback(async (id: number): Promise<void> => {
    await database.updateLastOpened(id);
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, last_opened: new Date().toISOString(), updated_at: new Date().toISOString() } : p))
    );
  }, []);

  const searchProjects = useCallback(async (query: string): Promise<Project[]> => {
    if (!query.trim()) return projects;
    return database.searchProjects(query);
  }, [projects]);

  return {
    projects,
    loading,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    toggleFavorite,
    togglePinned,
    updateLastOpened,
    searchProjects,
    refresh: load,
  };
}
