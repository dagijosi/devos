import { FaSave } from 'react-icons/fa';
import type { BackupConfig } from '../types';

interface AutoBackupSettingsProps {
  config: BackupConfig;
  onSave: (config: BackupConfig) => Promise<void>;
}

export function AutoBackupSettings({ config, onSave }: AutoBackupSettingsProps) {
  const handleChange = (field: keyof BackupConfig, value: any) => {
    onSave({ ...config, [field]: value });
  };

  return (
    <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-theme-text">Auto Backup Settings</h3>

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={config.autoBackup} onChange={e => handleChange('autoBackup', e.target.checked)} className="rounded border-theme-border/30 text-theme-icon focus:ring-theme-icon/30" />
        <div>
          <span className="text-sm text-theme-text">Enable automatic backups</span>
          <p className="text-[10px] text-theme-text/40">Backups run automatically in the background</p>
        </div>
      </label>

      {config.autoBackup && (
        <>
          <div>
            <label className="text-xs text-theme-text/60 mb-1 block">Backup Interval</label>
            <select value={config.interval} onChange={e => handleChange('interval', e.target.value)} className="bg-theme-background border border-theme-border/30 rounded-xl px-3 py-2.5 text-sm text-theme-text outline-none focus:border-theme-icon/50 w-full">
              <option value="hourly">Every Hour</option>
              <option value="6hours">Every 6 Hours</option>
              <option value="daily">Every Day</option>
              <option value="weekly">Every Week</option>
              <option value="never">Never</option>
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={config.encryptByDefault} onChange={e => handleChange('encryptByDefault', e.target.checked)} className="rounded border-theme-border/30 text-theme-icon focus:ring-theme-icon/30" />
            <span className="text-sm text-theme-text">Encrypt backups by default</span>
          </label>

          <div>
            <label className="text-xs text-theme-text/60 mb-1 block">Max Backups to Keep</label>
            <input type="number" min={1} max={50} value={config.maxBackups} onChange={e => handleChange('maxBackups', parseInt(e.target.value) || 10)} className="bg-theme-background border border-theme-border/30 rounded-xl px-3 py-2.5 text-sm text-theme-text outline-none focus:border-theme-icon/50 w-24" />
          </div>
        </>
      )}

      <div className="flex items-center gap-2 text-[10px] text-theme-text/30 pt-2 border-t border-theme-border/10">
        <FaSave className="w-3 h-3" />
        Settings are saved automatically
      </div>
    </div>
  );
}
