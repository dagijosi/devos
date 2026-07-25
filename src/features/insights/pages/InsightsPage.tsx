import { useState, useEffect, useCallback } from 'react';
import { FaLightbulb, FaProjectDiagram, FaStickyNote, FaCode, FaBug } from 'react-icons/fa';
import { toast } from 'sonner';
import { database } from '../../../database';
import { TimeRangeFilter } from '../components/TimeRangeFilter';
import { ExportMenu } from '../components/ExportMenu';
import { ProductivityOverview } from '../components/ProductivityOverview';
import { FocusTime } from '../components/FocusTime';
import { ProjectActivity } from '../components/ProjectActivity';
import { ProjectHealth } from '../components/ProjectHealth';
import { CodingActivity } from '../components/CodingActivity';
import { GoalsWidget } from '../components/GoalsWidget';
import { Timeline } from '../components/Timeline';
import { Achievements } from '../components/Achievements';
import { LanguageUsage } from '../components/LanguageUsage';
import { LearningProgress } from '../components/LearningProgress';
import { InsightWidget } from '../components/InsightWidget';
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
    default: {
      // custom range defaults to this week
      const start = new Date(now); start.setDate(start.getDate() - start.getDay() + 1);
      return { from: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`, to: today };
    }
  }
}

function getPreviousRange(range: TimeRange): { from: string; to: string } {
  const { from, to } = getDateRange(range);
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const span = toDate.getTime() - fromDate.getTime();
  const prevFrom = new Date(fromDate.getTime() - span - 86400000);
  const prevTo = new Date(fromDate.getTime() - 86400000);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { from: fmt(prevFrom), to: fmt(prevTo) };
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="bg-theme-surface border border-theme-border/20 rounded-2xl p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-theme-text">{value}</p>
        <p className="text-[11px] text-theme-text/40">{label}</p>
      </div>
    </div>
  );
}

export function InsightsPage() {
  const [range, setRange] = useState<TimeRange>('week');
  const [loading, setLoading] = useState(true);

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [prevActivities, setPrevActivities] = useState<ActivityLog[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectStats, setProjectStats] = useState<any[]>([]);
  const [totalNotes, setTotalNotes] = useState(0);
  const [totalSnippets, setTotalSnippets] = useState(0);
  const [totalBugs, setTotalBugs] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getDateRange(range);
      const { from: prevFrom, to: prevTo } = getPreviousRange(range);
      const [
        acts, prevActs, gs, projs, pstats, notes, snippets, bugs,
      ] = await Promise.all([
        database.getActivityByRange(from, to),
        database.getActivityByRange(prevFrom, prevTo),
        database.getGoals(),
        database.getProjects(),
        database.getAllProjectStats(),
        database.getNotes(),
        database.getSnippets(),
        database.getBugs(),
      ]);
      setActivities(acts);
      setPrevActivities(prevActs);
      setGoals(gs);
      setProjects(projs);
      setProjectStats(pstats);
      setTotalNotes(notes.length);
      setTotalSnippets(snippets.length);
      setTotalBugs(bugs.length);
    } catch (err) {
      console.error('[Insights] Failed to load data:', err);
      toast.error('Failed to load insights data');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Derived data ──────────────────────────────────────────────
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayActs = activities.filter((a) => a.started_at?.startsWith(todayStr));

  const todayFocus = todayActs.reduce((s, a) => s + (a.duration || 0), 0);
  const periodFocus = activities.reduce((s, a) => s + (a.duration || 0), 0);

  const projectsWorked = new Set(todayActs.filter((a) => a.project_id).map((a) => a.project_id)).size;
  const tasksCompleted = todayActs.filter((a) => a.type === 'task').length;
  const notesCreated = todayActs.filter((a) => a.type === 'note').length;
  const bugsSolved = todayActs.filter((a) => a.type === 'bug').length;
  const commits = todayActs.filter((a) => a.type === 'commit').length;

  const productivityScore = periodFocus > 0
    ? Math.min(100, Math.round((todayFocus / Math.max(periodFocus / Math.max(new Date().getDate(), 1), 1)) * 100))
    : 0;

  // Project distribution
  const projectActivityData = projectStats.length > 0
    ? projectStats.map((ps: any) => ({
        name: ps.name || `Project #${ps.project_id}`,
        percentage: Math.round((ps.total_time / Math.max(projectStats.reduce((s: number, p: any) => s + (p.total_time || 0), 0), 1)) * 100),
      })).sort((a: any, b: any) => b.percentage - a.percentage)
    : [];

  // Project health
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

  // Weekly activity chart
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
    const date = new Date(); date.setDate(date.getDate() - date.getDay() + 1 + i);
    const ds = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayActs = activities.filter((a) => a.started_at?.startsWith(ds));
    return { day, hours: Math.round(dayActs.reduce((s, a) => s + (a.duration || 0), 0) / 60 * 10) / 10 };
  });
  const maxHours = Math.max(...weekDays.map((d) => d.hours), 1);

  // Timeline
  const timelineEvents = activities.slice(0, 20).map((a) => ({
    time: a.started_at ? a.started_at.slice(11, 16) : '',
    description: a.description,
    type: a.type,
  }));

  // Focus entries (grouped by description, sorted by total time)
  const focusEntries = [
    ...new Set(activities.map((a) => a.description)),
  ].slice(0, 6).map((desc) => {
    const total = activities
      .filter((a) => a.description === desc)
      .reduce((s, a) => s + (a.duration || 0), 0);
    return { label: desc.length > 35 ? desc.slice(0, 35) + '...' : desc, minutes: total };
  }).filter((e) => e.minutes > 0).sort((a, b) => b.minutes - a.minutes);

  // Real trends (compare current period vs previous period)
  const prevNotes = prevActivities.filter((a) => a.type === 'note').length;
  const prevBugs = prevActivities.filter((a) => a.type === 'bug').length;
  const prevTasks = prevActivities.filter((a) => a.type === 'task').length;
  const prevCommits = prevActivities.filter((a) => a.type === 'commit').length;
  const currentNotes = activities.filter((a) => a.type === 'note').length;
  const currentBugs = activities.filter((a) => a.type === 'bug').length;
  const currentTasks = activities.filter((a) => a.type === 'task').length;
  const currentCommits = activities.filter((a) => a.type === 'commit').length;

  // Achievements data
  const achievements = [
    { label: 'First Project Created', unlocked: projects.length >= 1 },
    { label: 'First Note Taken', unlocked: totalNotes >= 1 },
    { label: '10 Notes Written', unlocked: totalNotes >= 10 },
    { label: 'Bug Hunter', unlocked: totalBugs >= 5 },
    { label: 'Snippet Collector', unlocked: totalSnippets >= 5 },
    { label: '7-Day Streak', unlocked: activities.filter(a => a.started_at?.startsWith(todayStr)).length >= 5 },
    { label: 'Goal Setter', unlocked: goals.length >= 1 },
    { label: 'Power User', unlocked: projects.length >= 3 && totalNotes >= 5 && totalSnippets >= 3 },
  ];

  // Language usage derived from snippet languages
  const languages = (() => {
    const langMap = new Map<string, number>();
    activities.filter(a => a.type === 'snippet').forEach(a => {
      const lang = a.description || 'Unknown';
      langMap.set(lang, (langMap.get(lang) || 0) + 1);
    });
    if (langMap.size === 0) return [];
    const total = [...langMap.values()].reduce((s, v) => s + v, 0);
    return [...langMap.entries()]
      .map(([name, count]) => ({ name, percentage: Math.round((count / total) * 100) }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 6);
  })();

  // Learning progress from notes tag topics
  const topics = (() => {
    const topicMap = new Map<string, number>();
    activities.filter(a => a.type === 'note').forEach(a => {
      const topic = a.description?.split(' ').slice(0, 3).join(' ') || 'General';
      topicMap.set(topic, (topicMap.get(topic) || 0) + 1);
    });
    if (topicMap.size === 0) return [];
    const max = Math.max(...topicMap.values(), 1);
    return [...topicMap.entries()]
      .map(([name, count]) => ({ name, progress: Math.min(100, Math.round((count / max) * 100)) }))
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 5);
  })();

  const pct = (current: number, prev: number) =>
    prev > 0 ? Math.round(((current - prev) / prev) * 100) : current > 0 ? 100 : 0;

  const trendsItems = [
    { label: 'Notes', change: pct(currentNotes, prevNotes) },
    { label: 'Bugs Squashed', change: pct(currentBugs, prevBugs) },
    { label: 'Tasks Done', change: pct(currentTasks, prevTasks) },
    { label: 'Commits', change: pct(currentCommits, prevCommits) },
  ].filter((t) => t.change !== 0);

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
        md += `## Productivity\n- Score: ${productivityScore}%\n- Focus Time: ${Math.floor(periodFocus / 60)}h ${periodFocus % 60}m\n- Projects: ${projectsWorked}\n- Tasks: ${tasksCompleted}\n\n`;
        md += `## Activity\n| Time | Description | Type |\n|------|-------------|------|\n`;
        activities.slice(0, 20).forEach((a) => { md += `| ${a.started_at?.slice(11, 16)} | ${a.description} | ${a.type} |\n`; });
        return md;
      }
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
            <p className="text-[11px] text-theme-text/40">Track your progress and activity</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu onExport={handleExport} />
          <TimeRangeFilter value={range} onChange={setRange} />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-theme-surface border border-theme-border/20 rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-theme-background/50 rounded w-1/3 mb-4" />
              <div className="h-20 bg-theme-background/50 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={FaProjectDiagram} label="Total Projects" value={projects.length} color="bg-blue-500" />
            <StatCard icon={FaStickyNote} label="Total Notes" value={totalNotes} color="bg-emerald-500" />
            <StatCard icon={FaCode} label="Total Snippets" value={totalSnippets} color="bg-amber-500" />
            <StatCard icon={FaBug} label="Total Bugs" value={totalBugs} color="bg-red-500" />
          </div>

          {/* Row 2: 3 cols */}
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
            <FocusTime entries={focusEntries} totalMinutes={periodFocus} />
            <ProjectActivity projects={projectActivityData} />
          </div>

          {/* Row 3: 2 cols */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <CodingActivity weekData={weekDays} maxHours={maxHours} />
            <ProjectHealth projects={projectHealthData} />
          </div>

          {/* Row 4: 2 cols */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Timeline events={timelineEvents} />
            <InsightWidget title="Trends" subtitle="Compared to previous period">
              <div className="space-y-2">
                {trendsItems.length > 0 ? trendsItems.map((t) => (
                  <div key={t.label} className="flex items-center justify-between py-1.5 border-b border-theme-border/5 last:border-0">
                    <span className="text-xs text-theme-text/60">{t.label}</span>
                    <span className={`text-xs font-semibold ${t.change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.change > 0 ? '+' : ''}{t.change}%
                    </span>
                  </div>
                )) : (
                  <p className="text-xs text-theme-text/40 text-center py-4">Not enough data for trends</p>
                )}
              </div>
            </InsightWidget>
          </div>

          {/* Row 5: Goals */}
          <div className="grid grid-cols-1 gap-5">
            <GoalsWidget goals={goals} onRefresh={loadData} />
          </div>

          {/* Row 6: Achievements, Language, Learning */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Achievements achievements={achievements} />
            <LanguageUsage languages={languages} />
            <LearningProgress topics={topics} />
          </div>
        </>
      )}
    </div>
  );
}
