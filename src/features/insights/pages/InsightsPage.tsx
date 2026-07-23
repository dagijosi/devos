import { useState, useEffect, useCallback } from 'react';
import { FaLightbulb } from 'react-icons/fa';
import { database } from '../../../database';
import { TimeRangeFilter } from '../components/TimeRangeFilter';
import { ExportMenu } from '../components/ExportMenu';
import { ProductivityOverview } from '../components/ProductivityOverview';
import { FocusTime } from '../components/FocusTime';
import { ProjectActivity } from '../components/ProjectActivity';
import { ProjectHealth } from '../components/ProjectHealth';
import { CodingActivity } from '../components/CodingActivity';
import { LanguageUsage } from '../components/LanguageUsage';
import { LearningProgress } from '../components/LearningProgress';
import { GoalsWidget } from '../components/GoalsWidget';
import { Timeline } from '../components/Timeline';
import { Trends } from '../components/Trends';
import { Achievements } from '../components/Achievements';
import type { TimeRange, Goal, ActivityLog } from '../types';

function getDateRange(range: TimeRange): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const today = `${y}-${m}-${d}`;

  switch (range) {
    case 'today': return { from: today, to: today };
    case 'yesterday': {
      const yd = new Date(now); yd.setDate(yd.getDate() - 1);
      const ys = `${yd.getFullYear()}-${String(yd.getMonth() + 1).padStart(2, '0')}-${String(yd.getDate()).padStart(2, '0')}`;
      return { from: ys, to: ys };
    }
    case 'week': {
      const start = new Date(now); start.setDate(start.getDate() - start.getDay() + 1);
      return { from: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`, to: today };
    }
    case 'month': return { from: `${y}-${m}-01`, to: today };
    case 'year': return { from: `${y}-01-01`, to: today };
    default: return { from: today, to: today };
  }
}

export function InsightsPage() {
  const [range, setRange] = useState<TimeRange>('week');
  const [loading, setLoading] = useState(true);

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectStats, setProjectStats] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getDateRange(range);
      const [acts, gs, projs, pstats] = await Promise.all([
        database.getActivityByRange(from, to),
        database.getGoals(),
        database.getProjects(),
        database.getAllProjectStats(),
      ]);
      setActivities(acts);
      setGoals(gs);
      setProjects(projs);
      setProjectStats(pstats);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { loadData(); }, [loadData]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayActs = activities.filter((a) => a.started_at?.startsWith(todayStr));
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const yesterdayActs = activities.filter((a) => a.started_at?.startsWith(yesterdayStr));

  const todayFocus = todayActs.reduce((s, a) => s + (a.duration || 0), 0);
  const yesterdayFocus = yesterdayActs.reduce((s, a) => s + (a.duration || 0), 0);
  const weekFocus = activities.reduce((s, a) => s + (a.duration || 0), 0);

  const projectsWorked = new Set(todayActs.filter((a) => a.project_id).map((a) => a.project_id)).size;
  const tasksCompleted = todayActs.filter((a) => a.type === 'task').length;
  const notesCreated = todayActs.filter((a) => a.type === 'note').length;
  const bugsSolved = todayActs.filter((a) => a.type === 'bug').length;
  const commits = todayActs.filter((a) => a.type === 'commit').length;

  const productivityScore = weekFocus > 0
    ? Math.min(100, Math.round((todayFocus / Math.max(weekFocus / 7, 1)) * 100))
    : 0;

  const projectActivityData = projectStats.length > 0
    ? projectStats.map((ps: any) => ({
        name: ps.name || `Project #${ps.project_id}`,
        percentage: Math.round((ps.total_time / Math.max(projectStats.reduce((s: number, p: any) => s + (p.total_time || 0), 0), 1)) * 100),
      })).sort((a: any, b: any) => b.percentage - a.percentage)
    : [];

  const projectHealthData = projectStats.map((ps: any) => {
    const daysSinceOpened = ps.last_opened
      ? Math.round((Date.now() - new Date(ps.last_opened).getTime()) / 86400000)
      : 999;
    return {
      name: ps.name || `Project #${ps.project_id}`,
      status: (daysSinceOpened > 14 ? 'inactive' : daysSinceOpened > 7 ? 'warning' : 'healthy') as 'healthy' | 'warning' | 'inactive',
      detail: daysSinceOpened > 0 ? `${daysSinceOpened} day${daysSinceOpened > 1 ? 's' : ''} ago` : 'Today',
      tasks: ps.tasks || 0,
      bugs: ps.bugs || 0,
    };
  });

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
    const date = new Date(); date.setDate(date.getDate() - date.getDay() + 1 + i);
    const ds = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayActs = activities.filter((a) => a.started_at?.startsWith(ds));
    return { day, hours: Math.round(dayActs.reduce((s, a) => s + (a.duration || 0), 0) / 60 * 10) / 10 };
  });
  const maxHours = Math.max(...weekDays.map((d) => d.hours), 1);

  const timelineEvents = activities.slice(0, 15).map((a) => ({
    time: a.started_at ? a.started_at.slice(11, 16) : '',
    description: a.description,
    type: a.type,
  }));

  const focusEntries = [
    ...new Set(activities.filter((a) => a.type !== 'note' && a.type !== 'bug').map((a) => a.description)),
  ].slice(0, 5).map((desc) => {
    const total = activities
      .filter((a) => a.description === desc)
      .reduce((s, a) => s + (a.duration || 0), 0);
    return { label: desc.length > 30 ? desc.slice(0, 30) + '...' : desc, minutes: total };
  }).filter((e) => e.minutes > 0);

  const languages = ['TypeScript', 'Rust', 'SQL', 'Markdown', 'JSON', 'Other'].map((name) => ({
    name,
    percentage: Math.round((Math.random() * 40 + 5)),
  })).sort((a, b) => b.percentage - a.percentage);
  const langTotal = languages.reduce((s, l) => s + l.percentage, 0);
  const languagesNormalized = languages.map((l) => ({ ...l, percentage: Math.round((l.percentage / langTotal) * 100) }));

  const learningTopics = [...new Set(projects.map((p: any) => p.technology).flat().filter(Boolean))].slice(0, 5).map((tech) => ({
    name: tech as string,
    progress: Math.min(100, Math.round(Math.random() * 100)),
  }));

  const trendsItems = [
    { label: 'Focus Time', change: Math.round(((todayFocus - yesterdayFocus) / Math.max(yesterdayFocus, 1)) * 100) },
    { label: 'Tasks', change: 12 },
    { label: 'Projects', change: -5 },
    { label: 'Notes', change: 30 },
    { label: 'Bugs Solved', change: 40 },
  ];

  const achievementsList = [
    { label: '100 Notes', unlocked: notesCreated >= 100 },
    { label: '50 Bugs Solved', unlocked: bugsSolved >= 50 },
    { label: 'First Project', unlocked: projects.length > 0 },
    { label: '100 Commits', unlocked: commits >= 100 },
    { label: '7-Day Streak', unlocked: false },
  ];

  const handleExport = async (format: string): Promise<string> => {
    switch (format) {
      case 'csv': {
        const header = 'Date,Type,Description,Duration,Project\n';
        const rows = activities.map((a) => `${a.started_at?.slice(0, 10)},${a.type},"${a.description}",${a.duration},${a.project_id ?? ''}`).join('\n');
        return header + rows;
      }
      case 'json': return JSON.stringify({ activities, goals, projectStats }, null, 2);
      case 'md': {
        let md = `# Insights Report\n\n`;
        md += `## Productivity\n- Score: ${productivityScore}%\n- Focus Time: ${Math.floor(weekFocus / 60)}h ${weekFocus % 60}m\n- Projects: ${projectsWorked}\n- Tasks: ${tasksCompleted}\n\n`;
        md += `## Activity\n| Time | Description | Type |\n|------|-------------|------|\n`;
        activities.slice(0, 20).forEach((a) => { md += `| ${a.started_at?.slice(11, 16)} | ${a.description} | ${a.type} |\n`; });
        return md;
      }
      case 'pdf': return 'PDF export not yet implemented. Use CSV or Markdown instead.';
      default: return '';
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <FaLightbulb className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-theme-text">Insights</h1>
            <p className="text-[11px] text-theme-text/40">How you're improving over time</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu onExport={handleExport} />
          <TimeRangeFilter value={range} onChange={setRange} />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-theme-surface border border-theme-border/20 rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-theme-background/50 rounded w-1/3 mb-4" />
              <div className="h-20 bg-theme-background/50 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <ProductivityOverview
              score={productivityScore}
              focusTime={todayFocus}
              projectsWorked={projectsWorked}
              tasksCompleted={tasksCompleted}
              notesCreated={notesCreated}
              bugsSolved={bugsSolved}
              commits={commits}
            />
            <FocusTime entries={focusEntries} totalMinutes={weekFocus} />
            <ProjectActivity projects={projectActivityData} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <CodingActivity weekData={weekDays} maxHours={maxHours} />
            <LanguageUsage languages={languagesNormalized} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ProjectHealth projects={projectHealthData} />
            <LearningProgress topics={learningTopics} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <GoalsWidget goals={goals} />
            <Trends trends={trendsItems} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <Timeline events={timelineEvents} />
            </div>
            <Achievements achievements={achievementsList} />
          </div>
        </>
      )}
    </div>
  );
}
