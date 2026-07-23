export interface AnalyticsSession {
  id: number;
  date: string;
  duration_minutes: number;
  type: 'focus' | 'coding' | 'debugging' | 'planning';
  label: string;
  created_at: string;
}

export interface DailyStats {
  date: string;
  total_minutes: number;
  sessions: number;
  focus_minutes: number;
  coding_minutes: number;
}

export interface WeeklyReport {
  week: string;
  total_minutes: number;
  daily_average: number;
  sessions: number;
  days_active: number;
}
