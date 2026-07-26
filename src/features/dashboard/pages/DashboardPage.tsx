import { useState, useEffect } from 'react';
import { FaBell, FaHeartbeat, FaHistory, FaProjectDiagram, FaRocket, FaStar, FaList } from 'react-icons/fa';
import { database } from '../../../database';
import type { Project } from '../../projects/types';
import { DashboardWidget } from '../components/DashboardWidget';
import { TodayOverview } from '../components/TodayOverview';
import { ProjectHealth } from '../components/ProjectHealth';
import { QuickActions } from '../components/QuickActions';
import { RecentActivity } from '../components/RecentActivity';
import { PinnedProjects } from '../components/PinnedProjects';
import { RunningServices } from '../components/RunningServices';
import { Upcoming } from '../components/Upcoming';
import { useNotifications } from '../../notifications/hooks/useNotifications';

export function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [failedCount, setFailedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  const stats = {
    active: projects.filter(p => p.status === 'active').length,
    failed: failedCount,
    tasks: projects.filter(p => p.status !== 'completed').length,
  };

  useEffect(() => {
    const load = async () => {
      const [all, deployments] = await Promise.all([
        database.getProjects(),
        database.getAllDeployments(),
      ]);
      setProjects(all);
      setFailedCount(deployments.filter((d) => d.status === 'failed').length);
      setLoading(false);
    };
    load();
  }, []);

  const togglePin = async (id: number) => {
    await database.toggleProjectFavorite(id);
    const all = await database.getProjects();
    setProjects(all);
  };

  return (
    <div className="space-y-5 max-w-[1600px]">
      {/* Section 1 — Today's Overview (full width) */}
      <TodayOverview stats={stats} />

      {/* 12-column grid */}
      <div className="grid grid-cols-12 gap-5">

        {/* Section 2 — Project Health (col-span-4) */}
        <div className="col-span-12 lg:col-span-4">
          <DashboardWidget title="Project Health" icon={<FaHeartbeat className="w-4 h-4" />} loading={loading}>
            <ProjectHealth projects={projects} loading={loading} />
          </DashboardWidget>
        </div>

        {/* Section 3 — Quick Actions (col-span-5) */}
        <div className="col-span-12 lg:col-span-5">
          <DashboardWidget title="Quick Actions" icon={<FaRocket className="w-4 h-4" />}>
            <QuickActions />
          </DashboardWidget>
        </div>

        {/* Section 4 — Upcoming (col-span-3) */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <DashboardWidget title="Today's Goals" icon={<FaList className="w-4 h-4" />}>
            <Upcoming />
          </DashboardWidget>
        </div>

        {/* Section 5 — Recent Activity (col-span-5) */}
        <div className="col-span-12 lg:col-span-5">
          <DashboardWidget title="Recent Activity" icon={<FaHistory className="w-4 h-4" />}>
            <RecentActivity />
          </DashboardWidget>
        </div>

        {/* Section 6 — Pinned Projects (col-span-4) */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <DashboardWidget title="Pinned Projects" icon={<FaStar className="w-4 h-4" />} loading={loading}>
            <PinnedProjects projects={projects} loading={loading} onTogglePin={togglePin} />
          </DashboardWidget>
        </div>

        {/* Section 7 — Running Services (col-span-3) */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <DashboardWidget title="Running Services" icon={<FaProjectDiagram className="w-4 h-4" />}>
            <RunningServices />
          </DashboardWidget>
        </div>

        {/* Section 8 — Notifications (col-span-4, row 3) */}
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
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      n.type === 'error' ? 'bg-red-400' :
                      n.type === 'warning' ? 'bg-yellow-400' :
                      n.type === 'success' ? 'bg-green-400' : 'bg-blue-400'
                    }`} />
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
