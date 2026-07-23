import { useState, useEffect, useCallback } from 'react';
import { FaCloudUploadAlt, FaExternalLinkAlt, FaPlay, FaTrash, FaPlus, FaChevronDown, FaChevronUp, FaCopy, FaCheck } from 'react-icons/fa';
import { database } from '../../../../database';
import type { Deployment, DeploymentLog } from '../../types';

interface Props {
  project: { id: number; name: string };
}

const PROVIDERS = [
  { value: 'vercel', label: 'Vercel', color: 'text-black dark:text-white' },
  { value: 'netlify', label: 'Netlify', color: 'text-green-400' },
  { value: 'github-pages', label: 'GitHub Pages', color: 'text-purple-400' },
  { value: 'docker', label: 'Docker', color: 'text-blue-400' },
  { value: 'custom', label: 'Custom', color: 'text-theme-text/60' },
];

const PROVIDER_ICONS: Record<string, string> = {
  vercel: '▲', netlify: '♾', 'github-pages': '📦', docker: '🐳', custom: '⚙',
};

const STATUS_COLORS: Record<string, string> = {
  idle: 'text-theme-text/30', deploying: 'text-blue-400 animate-pulse', success: 'text-green-400', failed: 'text-red-400',
};
const STATUS_BG: Record<string, string> = {
  idle: 'bg-theme-text/5', deploying: 'bg-blue-500/10', success: 'bg-green-500/10', failed: 'bg-red-500/10',
};

export function DeploymentsTab({ project }: Props) {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [logs, setLogs] = useState<Record<number, DeploymentLog[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const [form, setForm] = useState({ name: '', provider: 'vercel', url: '', build_command: 'npm run build', branch: 'main', auto_deploy: false });
  const [deploying, setDeploying] = useState<number | null>(null);

  const load = useCallback(async () => {
    const deps = await database.getProjectDeployments(project.id);
    setDeployments(deps);
    for (const d of deps) {
      const l = await database.getDeploymentLogs(d.id);
      setLogs(prev => ({ ...prev, [d.id]: l }));
    }
  }, [project.id]);

  useEffect(() => { load(); }, [load]);

  const addDeployment = async () => {
    if (!form.name.trim()) return;
    await database.addDeployment(project.id, form.name, form.provider, form.url, form.build_command, form.branch, form.auto_deploy ? 1 : 0);
    await database.addProjectActivity(project.id, `Added deployment: ${form.name}`, 'deploy');
    setForm({ name: '', provider: 'vercel', url: '', build_command: 'npm run build', branch: 'main', auto_deploy: false });
    setShowForm(false);
    setDeployments([]); setLogs({});
    await load();
  };

  const deleteDeployment = async (id: number) => {
    await database.deleteDeployment(id);
    setDeployments(prev => prev.filter(d => d.id !== id));
    setLogs(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const deploy = async (dep: Deployment) => {
    setDeploying(dep.id);
    const startTime = new Date().toISOString();
    await database.updateDeploymentStatus(dep.id, 'deploying');
    setDeployments(prev => prev.map(d => d.id === dep.id ? { ...d, status: 'deploying' } : d));

    const lines: string[] = [];
    const addLog = (msg: string) => lines.push(`[${new Date().toLocaleTimeString()}] ${msg}`);

    addLog(`Starting deployment: ${dep.name}`);
    addLog(`Provider: ${dep.provider}`);
    addLog(`Branch: ${dep.branch}`);
    addLog(`Build command: ${dep.build_command || '(none)'}`);

    // Simulate build steps
    for (let i = 0; i < 3; i++) {
      addLog(`Step ${i + 1}/3...`);
      await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
    }

    const success = Math.random() > 0.2; // 80% success simulation
    if (success) {
      addLog('Build complete');
      if (dep.url) addLog(`Deployed to: ${dep.url}`);
      addLog('Deployment successful');
      await database.updateDeploymentStatus(dep.id, 'success');
      setDeployments(prev => prev.map(d => d.id === dep.id ? { ...d, status: 'success', last_deployed_at: new Date().toISOString() } : d));
    } else {
      addLog('Error: Build failed - simulation error');
      await database.updateDeploymentStatus(dep.id, 'failed');
      setDeployments(prev => prev.map(d => d.id === dep.id ? { ...d, status: 'failed' } : d));
    }

    const output = lines.join('\n');
    await database.addDeploymentLog(dep.id, success ? 'success' : 'failed', output, startTime, new Date().toISOString());
    const newLogs = await database.getDeploymentLogs(dep.id);
    setLogs(prev => ({ ...prev, [dep.id]: newLogs }));
    setDeploying(null);
  };

  const copyUrl = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50";
  const btn = "px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors disabled:opacity-50";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-theme-text">Deployments</h3>
          <p className="text-xs text-theme-text/40 mt-0.5">{deployments.length} deployment{deployments.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className={`${btn} flex items-center gap-1.5`}>
          <FaPlus className="w-2.5 h-2.5" /> {showForm ? 'Cancel' : 'Add Deployment'}
        </button>
      </div>

      {showForm && (
        <div className="bg-theme-background border border-theme-border/20 rounded-xl p-4 space-y-3">
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Deployment name (e.g. Production)" className={ic} />
          <div className="flex gap-2">
            {PROVIDERS.map(p => (
              <button key={p.value} onClick={() => setForm(f => ({ ...f, provider: p.value }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.provider === p.value ? 'bg-theme-icon/10 text-theme-icon border border-theme-icon/20' : 'bg-theme-surface border border-theme-border/20 text-theme-text/60 hover:text-theme-text'}`}
              >{PROVIDER_ICONS[p.value]} {p.label}</button>
            ))}
          </div>
          <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="Deployment URL (optional)" className={ic} />
          <input value={form.build_command} onChange={e => setForm(p => ({ ...p, build_command: e.target.value }))} placeholder="Build command" className={ic} />
          <div className="flex gap-4 items-center">
            <label className="text-xs text-theme-text/60">Branch: <input value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))} className="w-28 bg-theme-surface border border-theme-border/20 rounded-lg px-2 py-1 text-xs text-theme-text ml-1" /></label>
            <label className="flex items-center gap-1.5 text-xs text-theme-text/40 cursor-pointer"><input type="checkbox" checked={form.auto_deploy} onChange={e => setForm(p => ({ ...p, auto_deploy: e.target.checked }))} className="accent-theme-icon" /> Auto-deploy</label>
          </div>
          <button onClick={addDeployment} disabled={!form.name.trim()} className={btn}>Add Deployment</button>
        </div>
      )}

      {deployments.length === 0 && !showForm && (
        <div className="text-center py-10">
          <FaCloudUploadAlt className="w-10 h-10 text-theme-text/20 mx-auto mb-3" />
          <p className="text-xs text-theme-text/30 max-w-sm mx-auto">No deployments configured. Add your first deployment target to start deploying.</p>
        </div>
      )}

      <div className="space-y-3">
        {deployments.map(dep => (
          <div key={dep.id} className="bg-theme-surface border border-theme-border/20 rounded-xl overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${STATUS_BG[dep.status] || 'bg-theme-background'} flex items-center justify-center text-sm`}>
                    {PROVIDER_ICONS[dep.provider] || '⚙'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-theme-text">{dep.name}</h4>
                      <span className={`text-[10px] font-medium ${STATUS_COLORS[dep.status] || 'text-theme-text/30'}`}>{dep.status}</span>
                    </div>
                    <p className="text-[10px] text-theme-text/30 mt-0.5">
                      {dep.provider} · {dep.branch}
                      {dep.last_deployed_at && ` · ${new Date(dep.last_deployed_at).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {dep.url && (
                    <a href={dep.url} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-theme-border/10 text-theme-text/40 hover:text-theme-icon transition-colors"
                      title="Open URL"><FaExternalLinkAlt className="w-3 h-3" /></a>
                  )}
                  {dep.url && (
                    <button onClick={() => copyUrl(dep.url, dep.id)}
                      className="p-1.5 rounded-lg hover:bg-theme-border/10 text-theme-text/40 hover:text-theme-icon transition-colors"
                      title="Copy URL">{copiedId === dep.id ? <FaCheck className="w-3 h-3 text-green-400" /> : <FaCopy className="w-3 h-3" />}</button>
                  )}
                </div>
              </div>

              {dep.build_command && (
                <div className="mt-3 flex items-center gap-2 text-[10px] text-theme-text/30">
                  <code className="bg-theme-background rounded px-2 py-0.5">{dep.build_command}</code>
                </div>
              )}

              <div className="mt-3 flex items-center gap-2">
                <button onClick={() => deploy(dep)} disabled={deploying !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon/10 text-theme-icon hover:bg-theme-icon/20 disabled:opacity-50 transition-colors">
                  <FaPlay className={`w-2.5 h-2.5 ${deploying === dep.id ? 'animate-spin' : ''}`} />
                  {deploying === dep.id ? 'Deploying...' : 'Deploy'}
                </button>
                {logs[dep.id]?.length > 0 && (
                  <button onClick={() => setExpanded(expanded === dep.id ? null : dep.id)}
                    className="flex items-center gap-1 text-[10px] text-theme-text/30 hover:text-theme-text transition-colors">
                    {expanded === dep.id ? <FaChevronUp className="w-2.5 h-2.5" /> : <FaChevronDown className="w-2.5 h-2.5" />}
                    {logs[dep.id].length} log{logs[dep.id].length !== 1 ? 's' : ''}
                  </button>
                )}
                <button onClick={() => deleteDeployment(dep.id)}
                  className="ml-auto p-1.5 rounded-lg hover:bg-red-500/10 text-theme-text/30 hover:text-red-400 transition-colors">
                  <FaTrash className="w-3 h-3" />
                </button>
              </div>
            </div>

            {expanded === dep.id && logs[dep.id]?.length > 0 && (
              <div className="border-t border-theme-border/10 bg-theme-background/50">
                {logs[dep.id].map(log => (
                  <div key={log.id} className="px-4 py-2 border-b border-theme-border/5 last:border-b-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-medium ${log.status === 'success' ? 'text-green-400' : log.status === 'failed' ? 'text-red-400' : 'text-theme-text/40'}`}>{log.status}</span>
                      <span className="text-[9px] text-theme-text/20">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    {log.output && <pre className="text-[10px] text-theme-text/50 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">{log.output}</pre>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
