import { useState } from 'react';
import { FaCopy, FaDownload, FaSync, FaCode, FaFileArchive } from 'react-icons/fa';
import type { GeneratedFile } from '../types';

interface Props {
  files: GeneratedFile[];
  activeFile: GeneratedFile | null;
  onCopy: () => void;
  onDownload: () => void;
  onCopyAll: () => void;
  onDownloadAll: () => void;
  onRegenerate: () => void;
  onFormat: () => void;
}

export function ExportActions({ files, activeFile, onCopy, onDownload, onCopyAll, onDownloadAll, onRegenerate, onFormat }: Props) {
  const [saving, setSaving] = useState(false);

  if (files.length === 0) return null;

  const handleDownloadAll = async () => {
    setSaving(true);
    try {
      await onDownloadAll();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button onClick={onCopy} disabled={!activeFile}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-theme-surface border border-theme-border/20 rounded-lg text-[10px] text-theme-text/60 hover:text-theme-icon hover:border-theme-icon/30 transition-colors disabled:opacity-30">
        <FaCopy className="w-2.5 h-2.5" /> Copy
      </button>
      <button onClick={onDownload} disabled={!activeFile}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-theme-surface border border-theme-border/20 rounded-lg text-[10px] text-theme-text/60 hover:text-theme-icon hover:border-theme-icon/30 transition-colors disabled:opacity-30">
        <FaDownload className="w-2.5 h-2.5" /> Download
      </button>
      <button onClick={onCopyAll} disabled={files.length === 0}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-theme-surface border border-theme-border/20 rounded-lg text-[10px] text-theme-text/60 hover:text-theme-icon hover:border-theme-icon/30 transition-colors disabled:opacity-30">
        <FaCopy className="w-2.5 h-2.5" /> Copy All
      </button>
      <button onClick={handleDownloadAll} disabled={files.length === 0 || saving}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-theme-surface border border-theme-border/20 rounded-lg text-[10px] text-theme-text/60 hover:text-theme-icon hover:border-theme-icon/30 transition-colors disabled:opacity-30">
        <FaFileArchive className="w-2.5 h-2.5" /> {saving ? 'Zipping...' : 'Download .zip'}
      </button>
      <div className="w-px h-4 bg-theme-border/20 mx-1" />
      <button onClick={onRegenerate}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-theme-surface border border-theme-border/20 rounded-lg text-[10px] text-theme-text/60 hover:text-theme-icon hover:border-theme-icon/30 transition-colors">
        <FaSync className="w-2.5 h-2.5" /> Regenerate
      </button>
      <button onClick={onFormat}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-theme-surface border border-theme-border/20 rounded-lg text-[10px] text-theme-text/60 hover:text-theme-icon hover:border-theme-icon/30 transition-colors">
        <FaCode className="w-2.5 h-2.5" /> Format
      </button>
    </div>
  );
}
