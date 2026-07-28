import { useState, useEffect } from 'react';
import { FaBell, FaHeartbeat, FaHistory, FaProjectDiagram, FaRocket, FaStar, FaList, FaCalendarDay, FaExclamationTriangle } from 'react-icons/fa';
import { database } from '../../../database';
import type { Project } from '../../projects/types';
import { DashboardWidget } from '../components/DashboardWidget';
import { TodayOverview } from '../components/TodayOverview';
import { ProjectHealth } from '../components/ProjectHealth';
import { QuickActions } from '../components/QuickActions';
import { RecentActivity } from '../components/RecentActivity';
import { PinnedProjects } from '../components/PinnedProjects';
import { ContinueWorkingCard } from '../components/ContinueWorkingCard';
import { Upcoming } from '../components/Upcoming';
import { useNotifications } from '../../notifications/hooks/useNotifications';
import { useActiveProjectStore } from '../../../stores/activeProject.store';
import { useNavigate } from 'react-router-dom';
import { TASKS } from '../../../routes/types/routeConstants';

export function DashboardPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [failedCount, setFailedCount] = useState(0);
  const [overdueTasks, setOverdueTasks] = useState<any[]>([]);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const activeProject = useActiveProjectStore((s) => s.activeProject);

  useEffect(() => {
    const load = async () => {
      try {
        const [all, deployments, overdue, today] = await Promise.all([
          database.getProjects(),
          database.getAllDeployments(),
          database.getOverdueProjectTasks(),
          database.getTodayProjectTasks(),
        ]);
        setProjects(all);
        setFailedCount(deployments.filter((d: any) => d.status === 'failed').length);
        setOverdueTasks(overdue || []);
        setTodayTasks(today || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const togglePin = async (id: number) => {
    await database.toggleProjectFavorite(id);
    const all = await database.getProjects();
    setProjects(all);
  };

  const activeCount = projects.filter(p => p.status === 'active').length;
  const pendingCount = todayTasks.filter((t: any) => t.status !== 'done').length;
  const overdueCount = overdueTasks.length;

  return (
    <div className="space-y-5 max-w-[1600px]">
      <TodayOverview stats={{ active: activeCount, failed: failedCount, tasks: pendingCount + overdueCount }} />

      <div className="grid grid-cols-12 gap-5">

        {/* Continue Working — full width when present */}
        {activeProject && (
          <div className="col-span-12">
            <ContinueWorkingCard />
          </div>
        )}

        {/* Today's Tasks (col-span-4) */}
        <div className="col-span-12 lg:col-span-4">
          <DashboardWidget
            title="Today's Tasks"
            icon={<FaCalendarDay className="w-4 h-4" />}
            action={todayTasks.length > 0 ? { label: 'View all', onClick: () => navigate(TASKS) } : undefined}
          >
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-theme-border/10 rounded animate-pulse" />)}
              </div>
            ) : todayTasks.filter((t: any) => t.status !== 'done').length === 0 ? (
              <div className="text-center py-4">
                <FaList className="w-6 h-6 text-theme-text/20 mx-auto mb-1" />
                <p className="text-xs text-theme-text/40">All clear for today</p>
              </div>
            ) : (
              <div className="space-y-1">
                {todayTasks.filter((t: any) => t.status !== 'done').slice(0, 5).map((task: any) => (
                  <div key={task.id} className="flex items-center gap-2 px-3 py-2 bg-theme-background/20 rounded-lg">
                    <span className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-400' : task.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'}`} />
                    <span className="text-xs text-theme-text/80 truncate flex-1">{task.title}</span>
                    {task.project_name && <span className="text-[10px] text-theme-text/40 shrink-0">{task.project_name}</span>}
                  </div>
                ))}
              </div>
            )}
          </DashboardWidget>
        </div>

        {/* Overdue Tasks (col-span-3) */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <DashboardWidget
            title="Overdue"
            icon={<FaExclamationTriangle className="w-4 h-4" />}
            action={overdueCount > 0 ? { label: 'View all', onClick: () => navigate(TASKS) } : undefined}
          >
            {loading ? (
              <div className="h-10 bg-theme-border/10 rounded animate-pulse" />
            ) : overdueCount === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-theme-text/40">Nothing overdue</p>
              </div>
            ) : (
              <div className="space-y-1">
                {overdueTasks.slice(0, 4).map((task: any) => (
                  <div key={task.id} className="flex items-center gap-2 px-3 py-2 bg-red-500/5 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-xs text-theme-text/80 truncate flex-1">{task.title}</span>
                    <span className="text-[10px] text-red-400 shrink-0">{task.project_name}</span>
                  </div>
                ))}
                {overdueCount > 4 && (
                  <p className="text-[10px] text-theme-text/40 text-center pt-1">+{overdueCount - 4} more</p>
                )}
              </div>
            )}
          </DashboardWidget>
        </div>

        {/* Quick Actions (col-span-5) */}
        <div className="col-span-12 lg:col-span-5">
          <DashboardWidget title="Quick Actions" icon={<FaRocket className="w-4 h-4" />}>
            <QuickActions />
          </DashboardWidget>
        </div>

        {/* Project Health (col-span-4) */}
        <div className="col-span-12 lg:col-span-4">
          <DashboardWidget title="Project Health" icon={<FaHeartbeat className="w-4 h-4" />} loading={loading}>
            <ProjectHealth projects={projects} loading={loading} />
          </DashboardWidget>
        </div>

        {/* Recent Activity (col-span-5) */}
        <div className="col-span-12 lg:col-span-5">
          <DashboardWidget title="Recent Activity" icon={<FaHistory className="w-4 h-4" />}>
            <RecentActivity />
          </DashboardWidget>
        </div>

        {/* Pinned Projects (col-span-4) */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <DashboardWidget title="Pinned Projects" icon={<FaStar className="w-4 h-4" />} loading={loading}>
            <PinnedProjects projects={projects} loading={loading} onTogglePin={togglePin} />
          </DashboardWidget>
        </div>

        {/* Running Services (col-span-3) */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <DashboardWidget title="Running Services" icon={<FaProjectDiagram className="w-4 h-4" />}>
            <Upcoming />
          </DashboardWidget>
        </div>

        {/* Notifications (col-span-4) */}
        <div className="col-span-12 lg:col-span-4">
          <DashboardWidget
            title="Notifications"
            icon={<FaBell className="w-4 h-4" />}
            action={unreadCount > 0 ? { label: 'Mark all read', onClick: markAllAsRead } : undefined}
          >
            {notifications.length === 0 ? (
              <div className="text-center py-4">
                <FaBell className="w-6 h-6 text-theme-text/20 mx-auto mb-1" />
                <p className="text-xs text-theme-text/40">No notifications</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {notifications.slice(0, 5).map(n => (
                  <div key={n.id} className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${n.read ? 'opacity-50' : 'hover:bg-theme-background/20'}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type === 'error' ? 'bg-red-400' : n.type === 'warning' ? 'bg-yellow-400' : n.type === 'success' ? 'bg-green-400' : 'bg-blue-400'}`} />
                    <div className="min-w-0">
                      <p className="text-xs text-theme-text/80 truncate">{n.title}</p>
                      <p className="text-[10px] text-theme-text/40">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardWidget>
        </div>

      </div>
    </div>
  );
}
