import { useState, useEffect } from 'react';
import { FaUsers, FaSync, FaCheck, FaTimes } from 'react-icons/fa';
import { toast } from 'sonner';
import { database } from '../../database';

const ENTITY_OPTIONS = [
  { value: 'projects', label: 'Projects' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'workflows', label: 'Workflows' },
  { value: 'knowledge', label: 'Knowledge' },
];

export function TeamSyncSettings() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    provider: 'local', sync_url: '', sync_token: '', auto_sync: false,
    sync_interval_minutes: 60, sync_entities: ['projects', 'tasks', 'workflows', 'knowledge'],
  });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    (async () => {
      const c = await database.getTeamSyncConfig();
      if (c) {
        setConfig(c);
        try { setForm({ ...form, ...c, auto_sync: !!c.auto_sync, sync_entities: JSON.parse(c.sync_entities || '["projects","tasks","workflows","knowledge"]') }); } catch {}
      }
      setLoading(false);
    })();
  }, []);

  const toggleEntity = (val: string) => {
    setForm(f => ({
      ...f,
      sync_entities: f.sync_entities.includes(val) ? f.sync_entities.filter((e: string) => e !== val) : [...f.sync_entities, val],
    }));
  };

  const handleSave = async () => {
    await database.upsertTeamSyncConfig({
      provider: form.provider, sync_url: form.sync_url, sync_token: form.sync_token,
      auto_sync: form.auto_sync ? 1 : 0, sync_interval_minutes: form.sync_interval_minutes,
      sync_entities: JSON.stringify(form.sync_entities),
    });
    setConfig(await database.getTeamSyncConfig());
    toast.success('Sync config saved');
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    // Simulate sync in demo
    await new Promise(r => setTimeout(r, 1500));
    await database.updateTeamSyncLastSync();
    setConfig(await database.getTeamSyncConfig());
    setSyncing(false);
    toast.success('Sync completed');
  };

  if (loading) return <div className="text-center py-8 text-xs text-theme-text/40">Loading sync config...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <FaUsers className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-theme-text">Team Sync</h3>
          <p className="text-xs text-theme-text/40">Sync project data across team members</p>
        </div>
      </div>

      <div className="bg-theme-surface border border-theme-border/20 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-medium text-theme-text/40 uppercase mb-1 block">Provider</label>
            <select value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
              className="w-full bg-theme-background border border-theme-border/30 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50">
              <option value="local">Local (single user)</option>
              <option value="git">Git-based sync</option>
              <option value="http">HTTP API sync</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-medium text-theme-text/40 uppercase mb-1 block">Interval (min)</label>
            <input type="number" value={form.sync_interval_minutes} onChange={e => setForm(f => ({ ...f, sync_interval_minutes: parseInt(e.target.value) || 60 }))}
              min={5} max={1440}
              className="w-full bg-theme-background border border-theme-border/30 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50" />
          </div>
        </div>

        {form.provider !== 'local' && (
          <>
            <div>
              <label className="text-[10px] font-medium text-theme-text/40 uppercase mb-1 block">Sync URL</label>
              <input value={form.sync_url} onChange={e => setForm(f => ({ ...f, sync_url: e.target.value }))}
                placeholder="https://team-sync.example.com/api" className="w-full bg-theme-background border border-theme-border/30 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50 font-mono" />
            </div>
            <div>
              <label className="text-[10px] font-medium text-theme-text/40 uppercase mb-1 block">Auth Token</label>
              <input type="password" value={form.sync_token} onChange={e => setForm(f => ({ ...f, sync_token: e.target.value }))}
                placeholder="Optional auth token" className="w-full bg-theme-background border border-theme-border/30 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50" />
            </div>
          </>
        )}

        <div>
          <label className="text-[10px] font-medium text-theme-text/40 uppercase mb-2 block">Sync Entities</label>
          <div className="flex flex-wrap gap-2">
            {ENTITY_OPTIONS.map(eo => (
              <button key={eo.value} onClick={() => toggleEntity(eo.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors border ${
                  form.sync_entities.includes(eo.value)
                    ? 'bg-theme-icon/10 border-theme-icon/30 text-theme-icon'
                    : 'bg-theme-background border-theme-border/20 text-theme-text/40 hover:text-theme-text'
                }`}>
                {form.sync_entities.includes(eo.value) ? <FaCheck className="w-2.5 h-2.5" /> : <FaTimes className="w-2.5 h-2.5" />}
                {eo.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-theme-border/10">
          <label className="flex items-center gap-2 text-xs text-theme-text/60 cursor-pointer">
            <input type="checkbox" checked={form.auto_sync} onChange={e => setForm(f => ({ ...f, auto_sync: e.target.checked }))} className="accent-theme-icon" />
            Auto-sync
          </label>
          <div className="flex items-center gap-2">
            {config?.last_sync_at && (
              <span className="text-[10px] text-theme-text/30">Last: {new Date(config.last_sync_at).toLocaleString()}</span>
            )}
            <button onClick={handleSave} className="px-3 py-1.5 text-xs font-medium bg-theme-icon text-white rounded-lg hover:bg-theme-icon/90 transition-colors">
              Save
            </button>
          </div>
        </div>
      </div>

      <button onClick={handleSyncNow} disabled={syncing}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 hover:bg-blue-500/20 transition-colors disabled:opacity-50">
        <FaSync className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  );
}
