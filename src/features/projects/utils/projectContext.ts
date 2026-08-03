import { useActiveProjectStore } from '../../../stores/activeProject.store';

type ProjectContext = { id: number; name: string; localPath: string; enabledModules?: string[] };

let _currentProject: ProjectContext | null = null;
const STORAGE_KEY = 'devos_active_project';

function normalize(project: { id: number; name: string; local_path?: string; localPath?: string; enabled_modules?: string[] } | null): ProjectContext | null {
  return project
    ? { id: project.id, name: project.name, localPath: project.local_path || project.localPath || '', enabledModules: project.enabled_modules }
    : null;
}

/**
 * Single context source: sets the module-level cache, sessionStorage,
 * the active-project store, and the legacy runtime hook.
 */
export function setProjectContext(project: { id: number; name: string; local_path?: string; enabled_modules?: string[] } | null) {
  _currentProject = normalize(project);
  if (typeof window !== 'undefined') {
    if (_currentProject) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(_currentProject));
    else sessionStorage.removeItem(STORAGE_KEY);
  }
  useActiveProjectStore.getState().setActiveProject(_currentProject);
}

export function getProjectContext() {
  if (!_currentProject) {
    // URL/store is the source of truth — fall back to the active store,
    // then to sessionStorage for legacy deep links.
    const ap = useActiveProjectStore.getState().activeProject;
    if (ap) {
      _currentProject = ap;
    } else if (typeof window !== 'undefined') {
      try { _currentProject = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null'); } catch { _currentProject = null; }
    }
  }
  return _currentProject;
}
