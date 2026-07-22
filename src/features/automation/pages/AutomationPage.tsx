import { FaPlay, FaPlus, FaClock } from 'react-icons/fa';

const workflows = [
  { name: 'Daily Backup', schedule: 'Every day at 2:00 AM', status: 'active', lastRun: 'Today, 2:00 AM' },
  { name: 'Weekly Report', schedule: 'Every Monday at 9:00 AM', status: 'active', lastRun: 'Mon, 9:00 AM' },
  { name: 'Code Lint Check', schedule: 'On file save', status: 'active', lastRun: 'Just now' },
];

export function AutomationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-text">Automation</h1>
          <p className="text-sm text-theme-text/60 mt-1">Automate your development workflow</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-theme-icon/20 text-theme-icon rounded-xl border border-theme-icon/30 hover:bg-theme-icon/30 transition-colors text-sm font-medium">
          <FaPlus className="w-3.5 h-3.5" />
          New Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {workflows.map((wf) => (
          <div key={wf.name} className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5 hover:border-theme-border/60 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <FaPlay className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-theme-text">{wf.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-theme-text/50">
                      <FaClock className="w-3 h-3" />
                      {wf.schedule}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      wf.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                      'bg-gray-500/10 text-gray-400 border border-gray-500/30'
                    }`}>
                      {wf.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right text-xs text-theme-text/40">
                Last run: {wf.lastRun}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
