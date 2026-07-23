import { useState } from 'react';
import { FaTimes, FaUpload, FaLock, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { Portal } from '../../../components/ui/overlays/Portal';

interface RestoreWizardProps {
  onRestore: (file: File, password?: string) => Promise<{ success: boolean; message: string }>;
  onClose: () => void;
}

type Step = 'select' | 'decrypt' | 'confirm' | 'result';

export function RestoreWizard({ onRestore, onClose }: RestoreWizardProps) {
  const [step, setStep] = useState<Step>('select');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const isEncrypted = f.name.includes('.enc');
    setNeedsPassword(isEncrypted);
    setStep(isEncrypted ? 'decrypt' : 'confirm');
  };

  const handleRestore = async () => {
    if (!file) return;
    setBusy(true);
    const pw = needsPassword ? password : undefined;
    const res = await onRestore(file, pw);
    setResult(res);
    setStep('result');
    setBusy(false);
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-md bg-theme-surface border border-theme-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme-border/30">
          <h3 className="text-sm font-semibold text-theme-text">Restore Backup</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-theme-border/20"><FaTimes className="w-4 h-4 text-theme-text/50" /></button>
        </div>

        <div className="p-5">
          {step === 'select' && (
            <div>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-theme-border/30 rounded-2xl p-8 cursor-pointer hover:border-theme-icon/40 transition-colors">
                <FaUpload className="w-8 h-8 text-theme-text/30 mb-3" />
                <span className="text-sm text-theme-text/50">Click to select a backup file</span>
                <span className="text-xs text-theme-text/30 mt-1">.json or .enc.json files</span>
                <input type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
              </label>
            </div>
          )}

          {step === 'decrypt' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-theme-text/70">
                <FaLock className="w-4 h-4 text-yellow-400" />
                This backup is encrypted. Enter the password to decrypt.
              </div>
              <div>
                <label className="text-xs text-theme-text/60 mb-1 block">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter backup password" className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep('select')} className="px-4 py-2 text-sm text-theme-text/60 hover:text-theme-text">Back</button>
                <button onClick={() => setStep('confirm')} className="px-5 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90">Continue</button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-theme-text/70">
                <FaExclamationTriangle className="w-4 h-4 text-yellow-400" />
                This will replace all current data with the backup.
              </div>
              <div className="bg-theme-background rounded-xl p-3 text-xs text-theme-text/60 space-y-1">
                <p><span className="font-medium text-theme-text/80">File:</span> {file?.name}</p>
                <p><span className="font-medium text-theme-text/80">Size:</span> {file ? `${(file.size / 1024).toFixed(1)} KB` : '-'}</p>
                <p><span className="font-medium text-theme-text/80">Encrypted:</span> {needsPassword ? 'Yes' : 'No'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(needsPassword ? 'decrypt' : 'select')} className="px-4 py-2 text-sm text-theme-text/60 hover:text-theme-text">Back</button>
                <button onClick={handleRestore} disabled={busy} className="px-5 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
                  {busy ? 'Restoring...' : 'Restore Data'}
                </button>
              </div>
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-4">
              <div className={`flex items-center gap-2 text-sm ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                {result.success ? <FaCheckCircle className="w-4 h-4" /> : <FaExclamationTriangle className="w-4 h-4" />}
                {result.success ? 'Restore Complete' : 'Restore Failed'}
              </div>
              <p className="text-xs text-theme-text/60">{result.message}</p>
              {!result.success && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-400">
                  The backup file may be corrupted, use the wrong password, or be in an incompatible format.
                </div>
              )}
              <button onClick={onClose} className="px-5 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90">
                {result.success ? 'Done' : 'Close'}
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </Portal>
  );
}
