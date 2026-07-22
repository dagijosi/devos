import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFolder, FaStickyNote, FaCode, FaStar, FaThumbtack } from 'react-icons/fa';
import { database } from '../../../database';
import type { Project } from '../../projects/types';
import { PROJECTS } from '../../../routes/types/routeConstants';

export function DashboardPage() {
  const navigate = useNavigate();
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [pinnedProjects, setPinnedProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });

  useEffect(() => {
    const load = async () => {
      const all = await database.getProjects();
      setRecentProjects(all.slice(0, 5));
      setPinnedProjects(all.filter((p) => p.pinned).slice(0, 4));
      setStats({
        total: all.length,
        active: all.filter((p) => p.status === 'active').length,
        completed: all.filter((p) => p.status === 'completed').length,
      });
    };
    load();
  }, []);

  const quickActions = [
    { label: 'New Project', icon: FaFolder, desc: 'Create a new project', action: () => navigate(`${PROJECTS}?new=true`) },
    { label: 'New Note', icon: FaStickyNote, desc: 'Quick note capture' },
    { label: 'View Projects', icon: FaFolder, desc: 'Browse all projects', action: () => navigate(PROJECTS) },
    { label: 'Open Terminal', icon: FaCode, desc: 'Command line' },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-theme-text">Welcome back</h1>
        <p className="text-sm text-theme-text/60 mt-1 max-w-lg">
          {stats.active} active project{stats.active !== 1 ? 's' : ''}, {stats.completed} completed
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-4">
          <p className="text-2xl font-bold text-theme-text">{stats.total}</p>
          <p className="text-xs text-theme-text/40 mt-1">Total Projects</p>
        </div>
        <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-4">
          <p className="text-2xl font-bold text-green-400">{stats.active}</p>
          <p className="text-xs text-theme-text/40 mt-1">Active</p>
        </div>
        <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-4">
          <p className="text-2xl font-bold text-blue-400">{stats.completed}</p>
          <p className="text-xs text-theme-text/40 mt-1">Completed</p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-theme-text mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button key={action.label} onClick={action.action}
              className="bg-theme-surface border border-theme-border/30 rounded-xl p-4 hover:border-theme-border/60 transition-colors text-left group">
              <div className="w-10 h-10 rounded-lg bg-theme-icon flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <action.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm font-medium text-theme-text">{action.label}</p>
              <p className="text-xs text-theme-text/40 mt-0.5">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaStar className="w-3.5 h-3.5 text-yellow-400" />
              <h2 className="text-sm font-semibold text-theme-text">Recent Projects</h2>
            </div>
            <button onClick={() => navigate(PROJECTS)} className="text-xs text-theme-icon/70 hover:text-theme-icon transition-colors">View all</button>
          </div>
          {recentProjects.length === 0 ? (
            <p className="text-sm text-theme-text/40 py-4 text-center">No projects yet</p>
          ) : (
            <div className="space-y-2">
              {recentProjects.map((p) => (
                <div key={p.id} onClick={() => navigate(`${PROJECTS}/${p.id}`)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-theme-background/30 transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-lg bg-theme-icon flex items-center justify-center flex-shrink-0">
                    <FaFolder className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-theme-text truncate">{p.name}</p>
                    <p className="text-xs text-theme-text/40">Updated {new Date(p.updated_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                    p.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                    'bg-gray-500/10 text-gray-400 border border-gray-500/30'
                  }`}>{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaThumbtack className="w-3.5 h-3.5 text-yellow-400" />
              <h2 className="text-sm font-semibold text-theme-text">Pinned Projects</h2>
            </div>
          </div>
          {pinnedProjects.length === 0 ? (
            <p className="text-sm text-theme-text/40 py-4 text-center">Pin projects for quick access</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {pinnedProjects.map((p) => (
                <div key={p.id} onClick={() => navigate(`${PROJECTS}/${p.id}`)}
                  className="p-3 rounded-xl bg-theme-background/30 border border-theme-border/10 hover:border-theme-border/30 transition-colors cursor-pointer">
                  <p className="text-sm font-medium text-theme-text truncate">{p.name}</p>
                  <p className="text-[11px] text-theme-text/40 mt-1 truncate">{p.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
