let _currentProject: { id: number; name: string; localPath: string } | null = null;

export function setProjectContext(project: { id: number; name: string; local_path?: string } | null) {
  _currentProject = project
    ? { id: project.id, name: project.name, localPath: project.local_path || '' }
    : null;
  if (typeof window !== 'undefined') {
    (window as any).__workflow_context = _currentProject
      ? { project_name: _currentProject.name, project_folder: _currentProject.localPath }
      : {};
  }
}

export function getProjectContext() {
  return _currentProject;
}
