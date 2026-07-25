import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPalette, FaDatabase, FaFolderOpen, FaInfoCircle, FaDownload, FaUpload, FaTachometerAlt, FaUniversalAccess, FaBug, FaCloudUploadAlt, FaExternalLinkAlt, FaSearch, FaTimes } from 'react-icons/fa';
import { ThemeSettings } from '../components/ThemeSettings';
import { PerformanceSettings } from '../components/PerformanceSettings';
import { AccessibilitySettings } from '../components/AccessibilitySettings';
import { LogViewer } from '../components/LogViewer';
import { UpdaterSettings } from '../components/UpdaterSettings';
import { database } from '../../../database';
import { toast } from 'sonner';
import { BACKUP } from '../../../routes/types/routeConstants';

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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('theme');
  const [settingsSearch, setSettingsSearch] = useState('');
  const [dbSize, setDbSize] = useState({ used: 0, total: 10 });

  const filteredTabs = useMemo(() => {
    if (!settingsSearch) return tabs;
    const q = settingsSearch.toLowerCase();
    return tabs.filter(t => t.label.toLowerCase().includes(q));
  }, [settingsSearch]);

  useEffect(() => {
    (async () => {
      try {
        const data = await database.exportAllData();
        const json = JSON.stringify(data);
        const bytes = new TextEncoder().encode(json).length;
        const mb = bytes / (1024 * 1024);
        setDbSize({ used: Math.round(mb * 10) / 10, total: 10 });
      } catch { /* silent */ }
    })();
  }, []);

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

      <div className="flex items-center gap-2 p-1 bg-theme-surface border border-theme-border/30 rounded-xl overflow-x-auto">
        <div className="relative flex-1 min-w-[120px] max-w-[200px]">
          <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-theme-text/30" />
          <input
            value={settingsSearch}
            onChange={e => setSettingsSearch(e.target.value)}
            placeholder="Search settings..."
            className="w-full pl-7 pr-7 py-1.5 bg-theme-background/50 border border-theme-border/20 rounded-lg text-xs text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50"
          />
          {settingsSearch && (
            <button onClick={() => setSettingsSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-theme-text/30 hover:text-theme-text">
              <FaTimes className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {filteredTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSettingsSearch(''); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-theme-icon/20 text-theme-icon shadow-sm'
                  : 'text-theme-text/40 hover:text-theme-text hover:bg-theme-background/50'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {filteredTabs.length === 0 && (
        <p className="text-xs text-theme-text/40 text-center py-4">No settings found for &ldquo;{settingsSearch}&rdquo;</p>
      )}

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
                <div className="h-full bg-theme-icon rounded-full transition-all" style={{ width: `${Math.min(100, (dbSize.used / dbSize.total) * 100)}%` }} />
              </div>
              <p className="text-xs text-theme-text/40 mt-1">{dbSize.used.toFixed(1)} MB / {dbSize.total} MB</p>
            </div>

            <div className="pt-3 border-t border-theme-border/10">
              <button
                onClick={async () => {
                  if (!window.confirm('Are you sure you want to reset the database? This will permanently delete ALL data including projects, notes, snippets, and settings. This cannot be undone.')) return;
                  if (!window.confirm('This is your final warning. All data will be lost. Proceed?')) return;
                  try {
                    await database.resetDatabase();
                    toast.success('Database reset. Reloading...');
                    setTimeout(() => window.location.reload(), 1000);
                  } catch (error) {
                    toast.error('Failed to reset database');
                    console.error(error);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-colors"
              >
                Reset Database
              </button>
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FaFolderOpen className="w-12 h-12 text-theme-text/20 mb-4" />
              <h3 className="text-sm font-semibold text-theme-text mb-1">Backup & Restore</h3>
              <p className="text-xs text-theme-text/40 mb-6 max-w-sm">
                Full backup management including manual backups, scheduling, encryption, restore, and history is available on the dedicated Backup page.
              </p>
              <button
                onClick={() => navigate(BACKUP)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-theme-icon rounded-xl hover:opacity-90 transition-opacity"
              >
                <FaExternalLinkAlt className="w-3.5 h-3.5" />
                Open Backup Page
              </button>
            </div>
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
