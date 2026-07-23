import { useState } from 'react';
import { FaPalette, FaDatabase, FaFolderOpen, FaInfoCircle, FaDownload, FaUpload, FaTachometerAlt, FaUniversalAccess, FaBug, FaCloudUploadAlt } from 'react-icons/fa';
import { ThemeSettings } from '../components/ThemeSettings';
import { PerformanceSettings } from '../components/PerformanceSettings';
import { AccessibilitySettings } from '../components/AccessibilitySettings';
import { LogViewer } from '../components/LogViewer';
import { UpdaterSettings } from '../components/UpdaterSettings';
import { database } from '../../../database';
import { toast } from 'sonner';

const tabs = [
  { id: 'theme' as const, label: 'Theme', icon: FaPalette },
  { id: 'performance' as const, label: 'Performance', icon: FaTachometerAlt },
  { id: 'accessibility' as const, label: 'Accessibility', icon: FaUniversalAccess },
  { id: 'database' as const, label: 'Database', icon: FaDatabase },
  { id: 'backup' as const, label: 'Backup Path', icon: FaFolderOpen },
  { id: 'logs' as const, label: 'Logs', icon: FaBug },
  { id: 'updates' as const, label: 'Updates', icon: FaCloudUploadAlt },
  { id: 'about' as const, label: 'About', icon: FaInfoCircle },
];

type SettingsTab = 'theme' | 'performance' | 'accessibility' | 'database' | 'backup' | 'logs' | 'updates' | 'about';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('theme');

  const handleExport = async () => {
    try {
      const data = await database.exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devos-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
      console.error(error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await database.importAllData(data);
      toast.success('Data imported successfully. Reloading...');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error('Failed to import data');
      console.error(error);
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-theme-text">Settings</h1>
        <p className="text-sm text-theme-text/60 mt-1">Configure your Developer OS</p>
      </div>

      <div className="flex gap-1 p-1 bg-theme-surface border border-theme-border/30 rounded-xl overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-theme-icon/20 text-theme-icon shadow-sm'
                : 'text-theme-text/40 hover:text-theme-text hover:bg-theme-background/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-6">
        {activeTab === 'theme' && <ThemeSettings />}

        {activeTab === 'performance' && <PerformanceSettings />}

        {activeTab === 'accessibility' && <AccessibilitySettings />}

        {activeTab === 'database' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-theme-text mb-1">Database Location</h3>
              <p className="text-xs text-theme-text/40 mb-3">SQLite database file path</p>
              <div className="flex items-center gap-2 p-3 bg-theme-background/50 rounded-xl border border-theme-border/20">
                <FaDatabase className="w-4 h-4 text-theme-text/40 flex-shrink-0" />
                <code className="text-sm text-theme-text/60 font-mono truncate">
                  ~/.developer-os/data/developer_os.db
                </code>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-theme-text mb-1">Data Sync</h3>
              <p className="text-xs text-theme-text/40 mb-3">Export or import data to sync between web dev and Tauri app</p>
              <div className="flex gap-3">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-theme-icon bg-theme-icon/10 border border-theme-icon/30 rounded-xl hover:bg-theme-icon/20 transition-colors"
                >
                  <FaDownload className="w-4 h-4" />
                  Export Data
                </button>
                <label className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-theme-icon bg-theme-icon/10 border border-theme-icon/30 rounded-xl hover:bg-theme-icon/20 transition-colors cursor-pointer">
                  <FaUpload className="w-4 h-4" />
                  Import Data
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-theme-text mb-1">Database Size</h3>
              <p className="text-xs text-theme-text/40 mb-3">Current storage usage</p>
              <div className="h-2 bg-theme-background/50 rounded-full overflow-hidden">
                <div className="h-full w-1/4 bg-theme-icon rounded-full" />
              </div>
              <p className="text-xs text-theme-text/40 mt-1">2.4 MB / 10 MB</p>
            </div>

            <div className="pt-3 border-t border-theme-border/10">
              <button className="px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-colors">
                Reset Database
              </button>
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-theme-text mb-1">Backup Directory</h3>
              <p className="text-xs text-theme-text/40 mb-3">Where automatic backups are stored</p>
              <div className="flex items-center gap-2 p-3 bg-theme-background/50 rounded-xl border border-theme-border/20">
                <FaFolderOpen className="w-4 h-4 text-theme-text/40 flex-shrink-0" />
                <code className="text-sm text-theme-text/60 font-mono truncate">
                  ~/.developer-os/backups/
                </code>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-theme-text mb-1">Auto Backup</h3>
              <p className="text-xs text-theme-text/40 mb-3">Schedule automatic database backups</p>
              <select className="w-full max-w-xs px-3 py-2 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text focus:outline-none focus:border-theme-icon/50">
                <option>Every hour</option>
                <option>Every 6 hours</option>
                <option>Every day</option>
                <option>Every week</option>
                <option>Never</option>
              </select>
            </div>

            <button className="px-4 py-2 text-sm font-medium text-theme-icon bg-theme-icon/10 border border-theme-icon/30 rounded-xl hover:bg-theme-icon/20 transition-colors">
              Create Backup Now
            </button>
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            <h3 className="text-sm font-semibold text-theme-text mb-4">Diagnostic Logs</h3>
            <LogViewer />
          </div>
        )}

        {activeTab === 'updates' && <UpdaterSettings />}

        {activeTab === 'about' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-theme-surface rounded-2xl border border-theme-border/30">
              <div className="w-14 h-14 rounded-2xl bg-theme-icon flex items-center justify-center flex-shrink-0">
                <FaInfoCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-theme-text">Developer OS</h3>
                <p className="text-sm text-theme-text/50">Version 0.1.0</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Tech Stack', value: 'Tauri v2 + React + TypeScript' },
                { label: 'Database', value: 'SQLite' },
                { label: 'State Management', value: 'Zustand + TanStack Query' },
                { label: 'Styling', value: 'Tailwind CSS' },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-theme-background/30 rounded-xl">
                  <p className="text-xs text-theme-text/40">{item.label}</p>
                  <p className="text-sm text-theme-text mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-theme-text/30">
              &copy; {new Date().getFullYear()} Developer OS. All rights reserved.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
