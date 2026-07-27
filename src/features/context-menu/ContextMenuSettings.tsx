import { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaDownload, FaTrash } from 'react-icons/fa';
import { toast } from 'sonner';

const isTauri = typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;

export function ContextMenuSettings() {
  const [installed, setInstalled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isTauri) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const result = await invoke('is_context_menu_installed');
        setInstalled(!!result);
      } catch {
        setInstalled(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!isTauri) {
    return (
      <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-theme-text mb-1">Context Menu Integration</h3>
        <p className="text-xs text-theme-text/40 mt-2">Not available on this OS</p>
      </div>
    );
  }

  const handleInstall = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('install_context_menu');
      setInstalled(true);
      toast.success('Context menu installed');
    } catch {
      toast.error('Failed to install context menu');
    }
  };

  const handleUninstall = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('uninstall_context_menu');
      setInstalled(false);
      toast.success('Context menu uninstalled');
    } catch {
      toast.error('Failed to uninstall context menu');
    }
  };

  return (
    <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-theme-text">Context Menu Integration</h3>
        <p className="text-xs text-theme-text/50 mt-0.5">Windows Explorer context menu integration</p>
      </div>

      <div className="flex items-center justify-between p-3 bg-theme-background/50 rounded-xl border border-theme-border/20">
        <div className="flex items-center gap-2">
          <span className="text-sm text-theme-text">Status</span>
          {loading ? (
            <span className="text-xs text-theme-text/40">Checking...</span>
          ) : installed ? (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <FaCheck className="w-3 h-3" /> Installed
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-red-400">
              <FaTimes className="w-3 h-3" /> Not installed
            </span>
          )}
        </div>

        {!loading && (
          installed ? (
            <button
              onClick={handleUninstall}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <FaTrash className="w-3 h-3" />
              Uninstall
            </button>
          ) : (
            <button
              onClick={handleInstall}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-colors"
            >
              <FaDownload className="w-3 h-3" />
              Install
            </button>
          )
        )}
      </div>
    </div>
  );
}
