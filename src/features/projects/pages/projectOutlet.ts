import { useOutletContext } from 'react-router-dom';
import type { Project } from '../types';

export interface ProjectOutletContext {
  project: Project | null;
  onRefresh: () => void;
}

export function useProjectOutlet(): ProjectOutletContext {
  return useOutletContext<ProjectOutletContext>();
}
