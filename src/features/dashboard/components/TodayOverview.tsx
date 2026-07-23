import { FaProjectDiagram, FaTasks, FaExclamationTriangle, FaClock } from 'react-icons/fa';
import { useAuthStore } from '../../../store/authStore';

interface TodayOverviewProps {
  stats: { active: number; failed: number; tasks: number };
  focusGoal?: string;
}

export function TodayOverview({ stats, focusGoal }: TodayOverviewProps) {
  const userName = useAuthStore(s => s.user?.name) || 'Developer';
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="bg-gradient-to-br from-theme-icon/10 to-theme-surface border border-theme-border/30 rounded-2xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-text">{greeting}, {userName.split(' ')[0]}</h1>
          <p className="text-sm text-theme-text/50 mt-0.5">{dayName} &middot; {dateStr}</p>
        </div>
        <div className="flex items-center gap-2 bg-theme-background/50 rounded-xl px-3 py-2 text-xs text-theme-text/50">
          <FaClock className="w-3 h-3 text-theme-icon" />
          <span>{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-5">
        <div className="bg-theme-background/40 rounded-xl p-3">
          <div className="flex items-center gap-2 text-theme-icon">
            <FaProjectDiagram className="w-3.5 h-3.5" />
            <span className="text-xl font-bold text-theme-text">{stats.active}</span>
          </div>
          <p className="text-[10px] text-theme-text/40 mt-0.5">Active Projects</p>
        </div>
        <div className="bg-theme-background/40 rounded-xl p-3">
          <div className="flex items-center gap-2 text-yellow-400">
            <FaTasks className="w-3.5 h-3.5" />
            <span className="text-xl font-bold text-theme-text">{stats.tasks}</span>
          </div>
          <p className="text-[10px] text-theme-text/40 mt-0.5">Pending Tasks</p>
        </div>
        <div className="bg-theme-background/40 rounded-xl p-3">
          <div className="flex items-center gap-2 text-red-400">
            <FaExclamationTriangle className="w-3.5 h-3.5" />
            <span className="text-xl font-bold text-theme-text">{stats.failed}</span>
          </div>
          <p className="text-[10px] text-theme-text/40 mt-0.5">Failed Deployments</p>
        </div>
      </div>

      {focusGoal && (
        <div className="mt-4 flex items-center gap-2 bg-theme-background/40 rounded-xl px-4 py-2.5 border border-theme-border/10">
          <span className="text-xs text-theme-text/50">Focus Goal:</span>
          <span className="text-sm font-medium text-theme-text truncate">{focusGoal}</span>
        </div>
      )}
    </div>
  );
}
