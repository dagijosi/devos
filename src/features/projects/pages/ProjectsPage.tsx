import { FaFolder, FaPlus } from 'react-icons/fa';

const sampleProjects = [
  { id: 1, name: 'Developer OS', description: 'Core desktop application', status: 'active', tasks: 12 },
  { id: 2, name: 'Website Redesign', description: 'Company website overhaul', status: 'active', tasks: 8 },
  { id: 3, name: 'Mobile App', description: 'React Native companion app', status: 'active', tasks: 24 },
  { id: 4, name: 'Legacy Migration', description: 'Migrate legacy services', status: 'completed', tasks: 0 },
];

export function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-text">Projects</h1>
          <p className="text-sm text-theme-text/60 mt-1">Manage your development projects</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-theme-icon/20 text-theme-icon rounded-xl border border-theme-icon/30 hover:bg-theme-icon/30 transition-colors text-sm font-medium">
          <FaPlus className="w-3.5 h-3.5" />
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sampleProjects.map((p) => (
          <div key={p.id} className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5 hover:border-theme-border/60 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <FaFolder className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-theme-text truncate">{p.name}</h3>
                <p className="text-sm text-theme-text/50 mt-0.5">{p.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                    'bg-gray-500/10 text-gray-400 border border-gray-500/30'
                  }`}>
                    {p.status}
                  </span>
                  <span className="text-xs text-theme-text/40">{p.tasks} tasks</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
