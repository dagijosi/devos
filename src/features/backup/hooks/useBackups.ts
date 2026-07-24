import { useState, useEffect, useCallback } from 'react';
import { database } from '../../../database';
import { createBackup, restoreFromBackup, getBackupConfig, saveBackupConfig } from '../services/backupService';
import type { BackupConfig } from '../types';

export function useBackups() {
  const [backups, setBackups] = useState<any[]>([]);
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [list, cfg] = await Promise.all([
      database.getBackups(),
      getBackupConfig(),
    ]);
    setBackups(list || []);
    setConfig(cfg as BackupConfig);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreateBackup = useCallback(async (password?: string): Promise<string> => {
    const result = await createBackup(password);
    await load();
    return result.filename;
  }, [load]);

  const handleRestore = useCallback(async (file: File, password?: string) => {
    const result = await restoreFromBackup(file, password);
    if (result.success) await load();
    return result;
  }, [load]);

  const handleDelete = useCallback(async (id: number) => {
    await database.deleteBackup(id);
    setBackups(prev => prev.filter(b => b.id !== id));
  }, []);

  const handleSaveConfig = useCallback(async (cfg: BackupConfig) => {
    await saveBackupConfig(cfg);
    setConfig(cfg);
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return { backups, config, loading, formatSize, createBackup: handleCreateBackup, restore: handleRestore, deleteBackup: handleDelete, saveConfig: handleSaveConfig, refresh: load };
}
