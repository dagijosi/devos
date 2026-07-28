let _currentProject: { id: number; name: string; localPath: string } | null = null;
const STORAGE_KEY = 'devos_active_project';

export function setProjectContext(project: { id: number; name: string; local_path?: string } | null) {
  _currentProject = project
    ? { id: project.id, name: project.name, localPath: project.local_path || '' }
    : null;
  if (typeof window !== 'undefined') {
    if (_currentProject) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(_currentProject));
    (window as any).__workflow_context = _currentProject
      ? { project_name: _currentProject.name, project_folder: _currentProject.localPath }
      : {};
  }
}

export function getProjectContext() {
  if (!_currentProject && typeof window !== 'undefined') {
    try { _currentProject = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null'); } catch { /* ignore malformed data */ }
  }
  return _currentProject;
}
