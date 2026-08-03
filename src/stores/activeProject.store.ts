import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ActiveProject {
  id: number;
  name: string;
  localPath: string;
  branch?: string;
  enabledModules?: string[];
}

interface ActiveProjectState {
  activeProject: ActiveProject | null;
  recentProjects: ActiveProject[];
  setActiveProject: (project: ActiveProject | null) => void;
  updateBranch: (branch: string) => void;
  clearActiveProject: () => void;
}

export const useActiveProjectStore = create<ActiveProjectState>()(
  persist(
    (set, get) => ({
      activeProject: null,
      recentProjects: [],
      setActiveProject: (project) => {
        const state = get();
        if (!project) {
          set({ activeProject: null });
          return;
        }
        const recent = state.recentProjects.filter((p) => p.id !== project.id);
        recent.unshift(project);
        set({ activeProject: project, recentProjects: recent.slice(0, 10) });
      },
      updateBranch: (branch) => {
        const current = get().activeProject;
        if (current) {
          set({ activeProject: { ...current, branch } });
        }
      },
      clearActiveProject: () => set({ activeProject: null }),
    }),
    { name: 'devos_active_project' }
  )
);
