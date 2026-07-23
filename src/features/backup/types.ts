export interface BackupRecord {
  id: number;
  filename: string;
  size_bytes: number;
  type: 'manual' | 'automatic';
  encrypted: number;
  notes: string;
  created_at: string;
}

export interface BackupConfig {
  autoBackup: boolean;
  interval: 'hourly' | '6hours' | 'daily' | 'weekly' | 'never';
  encryptByDefault: boolean;
  maxBackups: number;
}

export const BACKUP_DEFAULTS: BackupConfig = {
  autoBackup: false,
  interval: 'daily',
  encryptByDefault: false,
  maxBackups: 10,
};
