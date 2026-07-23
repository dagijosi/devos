import { useState, useCallback } from 'react';
import { FaPlus, FaDownload, FaTrash, FaLock, FaUnlock, FaHistory, FaTimes } from 'react-icons/fa';
import { toast } from 'sonner';
import { useBackups } from '../hooks/useBackups';
import { AutoBackupSettings } from '../components/AutoBackupSettings';
import { RestoreWizard } from '../components/RestoreWizard';

export function BackupPage() {
  const { backups, config, loading, formatSize, createBackup, restore, deleteBackup, saveConfig, refresh } = useBackups();
  const [showRestore, setShowRestore] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreateBackup = useCallback(async () => {
    setCreating(true);
    try {
      const pw = backupPassword || undefined;
      const filename = await createBackup(pw);
      toast.success(`Backup created: ${filename}`);
      setShowPasswordInput(false);
      setBackupPassword('');
    } catch (e: any) {
      toast.error(e.message || 'Backup failed');
    } finally {
      setCreating(false);
    }
  }, [createBackup, backupPassword]);

  const handleDownload = useCallback(async (backup: any) => {
    const data = await (await fetch('/')).text();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <h1 className="text-2xl font-bold text-theme-text">Backup & Restore</h1>
        <div className="grid grid-cols-1 gap-4">{[1,2].map(i => <div key={i} className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5 animate-pulse"><div className="h-4 bg-theme-border/20 rounded w-2/3 mb-3" /><div className="h-3 bg-theme-border/20 rounded w-1/2" /></div>)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-text">Backup & Restore</h1>
          <p className="text-sm text-theme-text/60 mt-1">Protect your data with backups and recovery</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPasswordInput(!showPasswordInput)} className="flex items-center gap-2 px-4 py-2 bg-theme-surface border border-theme-border/50 text-theme-text rounded-xl text-sm font-medium hover:bg-theme-surface/80 transition-colors">
            {showPasswordInput ? <FaUnlock className="w-3 h-3" /> : <FaLock className="w-3 h-3" />}
            {showPasswordInput ? 'Simple' : 'Encrypt'}
          </button>
          <button onClick={handleCreateBackup} disabled={creating} className="flex items-center gap-2 px-4 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors disabled:opacity-50">
            <FaPlus className="w-3 h-3" />
            {creating ? 'Creating...' : 'Backup Now'}
          </button>
          <button onClick={() => setShowRestore(true)} className="flex items-center gap-2 px-4 py-2 bg-theme-surface border border-theme-border/50 text-theme-text rounded-xl text-sm font-medium hover:bg-theme-surface/80 transition-colors">
            <FaHistory className="w-3 h-3" /> Restore
          </button>
        </div>
      </div>

      {showPasswordInput && (
        <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <FaLock className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <input type="password" value={backupPassword} onChange={e => setBackupPassword(e.target.value)} placeholder="Encryption password (leave empty for unencrypted)" className="flex-1 bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
          </div>
        </div>
      )}

      <AutoBackupSettings config={config!} onSave={saveConfig} />

      <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-theme-text mb-4">Backup History</h3>
        {backups.length === 0 ? (
          <div className="text-center py-8">
            <FaHistory className="w-8 h-8 text-theme-text/20 mx-auto mb-2" />
            <p className="text-xs text-theme-text/40">No backups yet. Create your first backup above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {backups.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between bg-theme-background border border-theme-border/20 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  {b.encrypted ? <FaLock className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" /> : <FaUnlock className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm text-theme-text truncate">{b.filename}</p>
                    <p className="text-[10px] text-theme-text/40">{formatSize(b.size_bytes)} &middot; {b.type} &middot; {new Date(b.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => deleteBackup(b.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-theme-text/30 hover:text-red-400 transition-colors">
                    <FaTrash className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showRestore && (
        <RestoreWizard onRestore={restore} onClose={() => { setShowRestore(false); refresh(); }} />
      )}
    </div>
  );
}
