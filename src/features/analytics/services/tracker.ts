import { database } from '../../../database';

const TRACKER_KEY = 'devos_session_start';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function startSession(type: string = 'focus', label: string = ''): Promise<void> {
  localStorage.setItem(TRACKER_KEY, JSON.stringify({ start: Date.now(), type, label }));
}

export async function endSession(): Promise<void> {
  const raw = localStorage.getItem(TRACKER_KEY);
  if (!raw) return;
  try {
    const { start, type, label } = JSON.parse(raw);
    const duration = Math.round((Date.now() - start) / 60000);
    if (duration >= 1) {
      await database.createAnalyticsSession({
        date: today(),
        duration_minutes: duration,
        type: type || 'focus',
        label: label || '',
      });
    }
  } catch { /* ignore */ }
  localStorage.removeItem(TRACKER_KEY);
}

export async function trackSession(duration_minutes: number, type: string = 'focus', label: string = ''): Promise<void> {
  await database.createAnalyticsSession({ date: today(), duration_minutes, type, label });
}

export async function getDailyStats(date?: string): Promise<{
  total_minutes: number; sessions: number; focus_minutes: number; coding_minutes: number;
}> {
  const d = date || today();
  const sessions = await database.getAnalyticsToday(d) || [];
  return {
    total_minutes: sessions.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0),
    sessions: sessions.length,
    focus_minutes: sessions.filter((s: any) => s.type === 'focus').reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0),
    coding_minutes: sessions.filter((s: any) => s.type !== 'focus').reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0),
  };
}

export async function getWeeklyReport(): Promise<{ day: string; minutes: number }[]> {
  const days: { day: string; minutes: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const stats = await getDailyStats(ds);
    days.push({ day: ds, minutes: stats.total_minutes });
  }
  return days;
}

export async function getMonthlyReport(): Promise<{ day: string; minutes: number }[]> {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const days: { day: string; minutes: number }[] = [];
  for (let i = 0; i < daysInMonth; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
    const ds = d.toISOString().slice(0, 10);
    if (ds > now.toISOString().slice(0, 10)) break;
    const stats = await getDailyStats(ds);
    days.push({ day: ds, minutes: stats.total_minutes });
  }
  return days;
}

export async function getYearlyReport(): Promise<{ month: string; minutes: number }[]> {
  const months: { month: string; minutes: number }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const m = new Date(now.getFullYear(), i, 1);
    const monthStr = m.toISOString().slice(0, 7);
    const daysInM = new Date(now.getFullYear(), i + 1, 0).getDate();
    let total = 0;
    for (let d = 1; d <= daysInM; d++) {
      const ds = `${monthStr}-${String(d).padStart(2, '0')}`;
      if (ds > now.toISOString().slice(0, 10)) break;
      const stats = await getDailyStats(ds);
      total += stats.total_minutes;
    }
    months.push({ month: monthStr, minutes: total });
  }
  return months;
}

export async function exportAnalyticsCSV(): Promise<string> {
  const sessions = await database.getAnalyticsSessions() || [];
  const header = 'id,date,duration_minutes,type,label,created_at';
  const rows = sessions.map((s: any) =>
    `${s.id},${s.date},${s.duration_minutes},${s.type},"${(s.label || '').replace(/"/g, '""')}",${s.created_at}`
  );
  return [header, ...rows].join('\n');
}
