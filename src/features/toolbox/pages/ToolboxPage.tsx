import { FaTerminal, FaDatabase, FaCode, FaWrench } from 'react-icons/fa';

const tools = [
  { name: 'Terminal', description: 'Integrated command line', icon: FaTerminal },
  { name: 'Database Browser', description: 'Browse and query SQLite', icon: FaDatabase },
  { name: 'JSON Formatter', description: 'Format and validate JSON', icon: FaCode },
  { name: 'RegEx Tester', description: 'Test regular expressions', icon: FaWrench },
];

export function ToolboxPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-theme-text">Toolbox</h1>
        <p className="text-sm text-theme-text/60 mt-1">Developer utilities at your fingertips</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <div key={tool.name} className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5 hover:border-theme-border/60 transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-theme-icon flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <tool.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-theme-text">{tool.name}</h3>
                <p className="text-sm text-theme-text/50 mt-0.5">{tool.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-6 text-center">
        <FaWrench className="w-8 h-8 text-theme-text/30 mx-auto mb-3" />
        <p className="text-sm text-theme-text/50">More tools coming in future updates</p>
      </div>
    </div>
  );
}
