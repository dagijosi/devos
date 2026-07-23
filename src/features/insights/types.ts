export interface ActivityLog {
  id: number;
  project_id?: number;
  type: string;
  description: string;
  started_at: string;
  ended_at?: string;
  duration: number;
}

export interface DailyStat {
  id: number;
  date: string;
  focus_time: number;
  projects: number;
  tasks: number;
  commits: number;
  notes: number;
  bugs: number;
}

export interface ProjectStat {
  id: number;
  project_id: number;
  total_time: number;
  last_opened?: string;
  commits: number;
  notes: number;
  bugs: number;
  name?: string;
  status?: string;
}

export interface Goal {
  id: number;
  title: string;
  target: number;
  progress: number;
  deadline?: string;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export type TimeRange = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';
