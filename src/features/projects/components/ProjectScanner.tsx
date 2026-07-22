import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaTimes, FaFolder } from 'react-icons/fa';
import type { ProjectFormData } from '../types';

interface ScanResult {
  path: string;
  name: string;
  technologies: string[];
}

interface Props {
  onSelect: (data: ProjectFormData) => void;
  onClose: () => void;
}

export function ProjectScanner({ onSelect, onClose }: Props) {
  const [path, setPath] = useState('');
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScanResult[] | null>(null);

  const handleScan = async () => {
    if (!path.trim()) return;
    setScanning(true);
    await new Promise((r) => setTimeout(r, 600));
    const folderName = path.split(/[\\/]/).filter(Boolean).pop() || 'Unknown';
    setResults([{ path: path.trim(), name: folderName, technologies: [] }]);
    setScanning(false);
  };

  return (
    <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-theme-text flex items-center gap-2">
          <FaSearch className="w-3.5 h-3.5 text-theme-icon" />
          Import Projects from Disk
        </h3>
        <button onClick={onClose} className="p-1.5 rounded-lg text-theme-text/30 hover:text-theme-text transition-colors">
          <FaTimes className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="Enter root folder path..."
          className="flex-1 px-3 py-2 bg-theme-background border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50" />
        <button onClick={handleScan} disabled={scanning}
          className="px-4 py-2 text-sm font-medium text-white bg-theme-icon rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
          {scanning ? 'Scanning...' : 'Scan'}
        </button>
      </div>

      <AnimatePresence>
        {results && results.length === 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-theme-text/40 text-center py-4">
            No projects found in this directory.
          </motion.p>
        )}
        {results && results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 max-h-64 overflow-y-auto">
            {results.map((dir) => (
              <div key={dir.path} className="flex items-center justify-between p-3 rounded-xl bg-theme-background/50 border border-theme-border/10 hover:border-theme-border/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <FaFolder className="w-4 h-4 text-theme-icon/60 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-theme-text truncate">{dir.name}</p>
                    <p className="text-[11px] text-theme-text/40 truncate">{dir.path}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {dir.technologies.slice(0, 2).map((t) => (
                    <span key={t} className="px-1.5 py-0.5 text-[10px] rounded-md font-medium bg-blue-500/10 text-blue-400">{t}</span>
                  ))}
                  <button
                    onClick={() => onSelect({ name: dir.name, description: '', tags: dir.technologies, repository_url: '', local_path: dir.path, status: 'active' })}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-theme-icon rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Import
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
