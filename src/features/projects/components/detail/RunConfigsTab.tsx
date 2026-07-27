import { useState, useEffect, useCallback } from 'react';
import { FaPlay, FaPlus, FaTrash, FaTerminal } from 'react-icons/fa';
import { database } from '../../../../database';
import { useNavigate } from 'react-router-dom';
import { TERMINAL } from '../../../../routes/types/routeConstants';

interface Props {
  projectId: number;
  localPath?: string;
}

interface Script {
  id: number;
  project_id: number;
  name: string;
  command: string;
}

export function RunConfigsTab({ projectId, localPath }: Props) {
  const navigate = useNavigate();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [command, setCommand] = useState('');

  const load = useCallback(async () => {
    const rows = await database.getProjectScripts(projectId);
    setScripts(rows as Script[]);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!name.trim() || !command.trim()) return;
    await database.addProjectScript(projectId, name.trim(), command.trim());
    setName(''); setCommand(''); setShowForm(false);
    await load();
  };

  const handleDelete = async (id: number) => {
    await database.deleteProjectScript(id);
    await load();
  };

  const handleRun = (script: Script) => {
    navigate(`${TERMINAL}?cmd=${encodeURIComponent(script.command)}&cwd=${encodeURIComponent(localPath || '')}&label=${encodeURIComponent(script.name)}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-theme-text">Run Configurations</h3>
          <p className="text-xs text-theme-text/40 mt-0.5">Save and launch dev commands</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-theme-icon text-white rounded-xl hover:bg-theme-icon/90 transition-colors">
          <FaPlus className="w-3 h-3" /> Add
        </button>
      </div>

      {showForm && (
        <div className="bg-theme-surface border border-theme-border/20 rounded-xl p-4 space-y-3">
          <div>
            <label className="text-[10px] font-medium text-theme-text/40 uppercase tracking-wider">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Dev Server"
              className="w-full mt-1 bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 font-mono" />
          </div>
          <div>
            <label className="text-[10px] font-medium text-theme-text/40 uppercase tracking-wider">Command</label>
            <input type="text" value={command} onChange={e => setCommand(e.target.value)}
              placeholder="e.g. npm run dev"
              className="w-full mt-1 bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 font-mono" />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => { setShowForm(false); setName(''); setCommand(''); }}
              className="px-3 py-1.5 text-xs text-theme-text/50 hover:text-theme-text transition-colors">Cancel</button>
            <button onClick={handleAdd}
              className="px-4 py-1.5 text-xs font-medium bg-theme-icon text-white rounded-xl hover:bg-theme-icon/90 transition-colors">Save</button>
          </div>
        </div>
      )}

      {scripts.length === 0 && !showForm && (
        <div className="text-center py-8 text-theme-text/30">
          <FaTerminal className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-xs">No run configs yet</p>
          <p className="text-[10px] mt-0.5">Add commands like <span className="font-mono text-theme-text/50">npm run dev</span></p>
        </div>
      )}

      <div className="space-y-2">
        {scripts.map(script => (
          <div key={script.id}
            className="flex items-center gap-3 bg-theme-surface border border-theme-border/20 rounded-xl px-4 py-3 group hover:border-theme-icon/30 transition-colors">
            <FaTerminal className="w-4 h-4 text-theme-text/30 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-theme-text truncate">{script.name}</p>
              <p className="text-xs font-mono text-theme-text/40 truncate">{script.command}</p>
            </div>
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleRun(script)}
                title="Run in terminal"
                className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">
                <FaPlay className="w-3 h-3" />
              </button>
              <button onClick={() => handleDelete(script.id)}
                title="Delete"
                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                <FaTrash className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
