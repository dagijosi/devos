import { useState, useEffect, useCallback } from 'react';
import {
  getDailyStats, getWeeklyReport, getMonthlyReport, getYearlyReport, exportAnalyticsCSV, trackSession
} from '../services/tracker';
import { database } from '../../../database';

export function useAnalytics() {
  const [dailyStats, setDailyStats] = useState({ total_minutes: 0, sessions: 0, focus_minutes: 0, coding_minutes: 0 });
  const [weeklyData, setWeeklyData] = useState<{ day: string; minutes: number }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ day: string; minutes: number }[]>([]);
  const [yearlyData, setYearlyData] = useState<{ month: string; minutes: number }[]>([]);
  const [projectCount, setProjectCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [daily, weekly, monthly, yearly, projects] = await Promise.all([
      getDailyStats(),
      getWeeklyReport(),
      getMonthlyReport(),
      getYearlyReport(),
      database.getProjects(),
    ]);
    setDailyStats(daily);
    setWeeklyData(weekly);
    setMonthlyData(monthly);
    setYearlyData(yearly);
    setProjectCount(projects.length);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addSession = useCallback(async (minutes: number, type?: string, label?: string) => {
    await trackSession(minutes, type, label);
    await load();
  }, [load]);

  const exportCSV = useCallback(async () => {
    const csv = await exportAnalyticsCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const totalMonthlyMinutes = monthlyData.reduce((sum, d) => sum + d.minutes, 0);
  const totalYearlyMinutes = yearlyData.reduce((sum, m) => sum + m.minutes, 0);

  return {
    dailyStats, weeklyData, monthlyData, yearlyData,
    projectCount, loading,
    totalMonthlyMinutes, totalYearlyMinutes,
    addSession, exportCSV, refresh: load,
  };
}
