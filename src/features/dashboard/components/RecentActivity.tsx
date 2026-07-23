import { useEffect, useState } from 'react';
import { FaHistory, FaFolder, FaStickyNote, FaBug, FaCode, FaExclamationTriangle } from 'react-icons/fa';
import { database } from '../../../database';

interface ActivityItem {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  description: string;
  created_at: string;
}

const typeIcons: Record<string, any> = {
  project: FaFolder,
  note: FaStickyNote,
  bug: FaBug,
  snippet: FaCode,
};

const typeColors: Record<string, string> = {
  project: 'text-blue-400',
  note: 'text-yellow-400',
  bug: 'text-red-400',
  snippet: 'text-green-400',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const rows = await database.getRecentActivity(10);
        setActivities(rows || []);
      } catch { /* noop */ }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-theme-border/10" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-theme-border/10 rounded w-2/3" />
              <div className="h-2 bg-theme-border/10 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <FaHistory className="w-8 h-8 text-theme-text/20 mx-auto mb-2" />
        <p className="text-xs text-theme-text/40">No recent activity</p>
        <p className="text-[10px] text-theme-text/30 mt-1">Start creating projects and taking notes</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((a, i) => {
        const Icon = typeIcons[a.entity_type] || FaExclamationTriangle;
        const color = typeColors[a.entity_type] || 'text-theme-text/30';
        const showDate = i === 0 || new Date(a.created_at).toDateString() !== new Date(activities[i - 1].created_at).toDateString();

        return (
          <div key={a.id}>
            {showDate && i > 0 && (
              <div className="flex items-center gap-2 py-2">
                <div className="h-px flex-1 bg-theme-border/10" />
                <span className="text-[10px] text-theme-text/30">{timeAgo(a.created_at)}</span>
                <div className="h-px flex-1 bg-theme-border/10" />
              </div>
            )}
            <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-theme-background/20 transition-colors">
              <div className={`w-8 h-8 rounded-lg bg-theme-background/50 flex items-center justify-center ${color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-theme-text/80 truncate">{a.description}</p>
                <p className="text-[10px] text-theme-text/30 mt-0.5">{timeAgo(a.created_at)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
