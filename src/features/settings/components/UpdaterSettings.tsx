import { useState } from 'react';
import { FaSync, FaDownload, FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { toast } from 'sonner';
import { checkForUpdates, installUpdate, type UpdateInfo } from '../../../utils/updater';

export function UpdaterSettings() {
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [checked, setChecked] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    setChecked(false);
    setUpdateInfo(null);
    try {
      const info = await checkForUpdates();
      setUpdateInfo(info);
      setChecked(true);
      if (info.available) {
        toast.success(`Update v${info.version} available!`);
      } else {
        toast.success('You are up to date');
      }
    } catch {
      toast.error('Failed to check for updates');
    } finally {
      setChecking(false);
    }
  };

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await installUpdate();
      toast.success('Update installed! Restarting...');
    } catch {
      toast.error('Failed to install update');
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-theme-text">Application Updates</h3>
          <p className="text-xs text-theme-text/50 mt-0.5">Current version: v1.0.3</p>
        </div>
        <button
          onClick={handleCheck}
          disabled={checking || installing}
          className="flex items-center gap-2 px-4 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors disabled:opacity-50"
        >
          <FaSync className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking...' : 'Check for Updates'}
        </button>
      </div>

      {checked && updateInfo && (
        <div className={`rounded-xl p-4 border ${updateInfo.available ? 'bg-green-500/10 border-green-500/30' : 'bg-theme-background border-theme-border/20'}`}>
          {updateInfo.available ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FaDownload className="w-4 h-4 text-green-400" />
                <span className="text-sm text-theme-text font-medium">v{updateInfo.version} is available</span>
              </div>
              {updateInfo.releaseDate && (
                <p className="text-xs text-theme-text/50">Released: {new Date(updateInfo.releaseDate).toLocaleDateString()}</p>
              )}
              {updateInfo.releaseNotes && (
                <details>
                  <summary className="text-xs text-theme-text/40 cursor-pointer hover:text-theme-text/60">Release notes</summary>
                  <pre className="mt-2 text-xs text-theme-text/60 whitespace-pre-wrap max-h-32 overflow-y-auto bg-theme-background rounded-lg p-3">
                    {updateInfo.releaseNotes}
                  </pre>
                </details>
              )}
              <button
                onClick={handleInstall}
                disabled={installing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {installing ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaDownload className="w-3 h-3" />}
                {installing ? 'Installing...' : 'Install & Restart'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <FaCheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-theme-text">You are running the latest version</span>
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-theme-text/30 flex items-center gap-1">
        <FaExclamationTriangle className="w-3 h-3" />
        Updates check against GitHub releases. An internet connection is required.
      </p>
    </div>
  );
}
