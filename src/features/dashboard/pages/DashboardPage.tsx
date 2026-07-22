import { FaFolder, FaStickyNote, FaRocket, FaServer, FaShieldAlt, FaDatabase, FaCode } from 'react-icons/fa';

const recentProjects = [
  { id: 1, name: 'Developer OS', status: 'active', updated: '2 hours ago' },
  { id: 2, name: 'Website Redesign', status: 'active', updated: '1 day ago' },
  { id: 3, name: 'Mobile App', status: 'active', updated: '3 days ago' },
];

const recentNotes = [
  { id: 1, title: 'Architecture decisions', preview: 'Using Tauri v2 with SQLite...', date: 'Today' },
  { id: 2, title: 'API design patterns', preview: 'REST vs GraphQL considerations...', date: 'Yesterday' },
  { id: 3, title: 'Release checklist', preview: 'Before shipping v1.0...', date: '2 days ago' },
];

const quickActions = [
  { label: 'New Project', icon: FaFolder, color: 'from-blue-500 to-blue-600', desc: 'Create a new project' },
  { label: 'New Note', icon: FaStickyNote, color: 'from-green-500 to-green-600', desc: 'Quick note capture' },
  { label: 'Run Workflow', icon: FaRocket, color: 'from-purple-500 to-purple-600', desc: 'Execute automation' },
  { label: 'Open Terminal', icon: FaCode, color: 'from-gray-500 to-gray-600', desc: 'Command line' },
];

const systemStatus = [
  { label: 'Database', status: 'Connected', icon: FaDatabase, healthy: true },
  { label: 'Storage', status: '78% Used', icon: FaServer, healthy: true },
  { label: 'Security', status: 'All Passed', icon: FaShieldAlt, healthy: true },
];

export function DashboardPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent border border-blue-500/20 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-theme-text">Welcome back</h1>
        <p className="text-sm text-theme-text/60 mt-1 max-w-lg">
          Your workspace is ready. Here's a snapshot of your projects, notes, and system status.
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-theme-text mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              className="bg-theme-surface border border-theme-border/30 rounded-xl p-4 hover:border-theme-border/60 transition-colors text-left group"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-2 group-hover:scale-105 transition-transform`}>
                <action.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm font-medium text-theme-text">{action.label}</p>
              <p className="text-xs text-theme-text/40 mt-0.5">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Projects + Recent Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-theme-text">Recent Projects</h2>
            <span className="text-xs text-theme-icon/70">View all</span>
          </div>
          <div className="space-y-3">
            {recentProjects.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-theme-background/30 transition-colors cursor-pointer">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <FaFolder className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-theme-text truncate">{p.name}</p>
                  <p className="text-xs text-theme-text/40">Updated {p.updated}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-theme-text">Recent Notes</h2>
            <span className="text-xs text-theme-icon/70">View all</span>
          </div>
          <div className="space-y-3">
            {recentNotes.map((n) => (
              <div key={n.id} className="p-3 rounded-xl hover:bg-theme-background/30 transition-colors cursor-pointer">
                <p className="text-sm font-medium text-theme-text">{n.title}</p>
                <p className="text-xs text-theme-text/40 mt-0.5 line-clamp-1">{n.preview}</p>
                <p className="text-[10px] text-theme-text/30 mt-1">{n.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-theme-text mb-4">System Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {systemStatus.map((s) => (
            <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl bg-theme-background/30">
              <div className={`w-9 h-9 rounded-lg ${s.healthy ? 'bg-green-500/10' : 'bg-yellow-500/10'} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.healthy ? 'text-green-400' : 'text-yellow-400'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-theme-text">{s.label}</p>
                <p className={`text-xs ${s.healthy ? 'text-green-400' : 'text-yellow-400'}`}>{s.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
