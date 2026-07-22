import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaTimes, FaFolder } from 'react-icons/fa';
import { PROJECT_FORM } from '../../../routes/types/routeConstants';

interface ScanResult {
  path: string;
  name: string;
  technologies: string[];
  description: string;
  repositoryUrl: string;
}

interface Props {
  onClose: () => void;
}

export function ProjectScanner({ onClose }: Props) {
  const navigate = useNavigate();
  const [path, setPath] = useState('');
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScanResult[] | null>(null);

  const detectTechnologies = (folderName: string): string[] => {
    const techs: string[] = [];
    const lowerName = folderName.toLowerCase();

    if (lowerName.includes('react') || lowerName.includes('next')) techs.push('React');
    if (lowerName.includes('vue')) techs.push('Vue');
    if (lowerName.includes('angular')) techs.push('Angular');
    if (lowerName.includes('node') || lowerName.includes('express')) techs.push('Node.js');
    if (lowerName.includes('python') || lowerName.includes('django') || lowerName.includes('flask')) techs.push('Python');
    if (lowerName.includes('rust')) techs.push('Rust');
    if (lowerName.includes('go') || lowerName.includes('golang')) techs.push('Go');
    if (lowerName.includes('java') || lowerName.includes('spring')) techs.push('Java');
    if (lowerName.includes('typescript') || lowerName.includes('ts')) techs.push('TypeScript');
    if (lowerName.includes('javascript') || lowerName.includes('js')) techs.push('JavaScript');

    return techs.length > 0 ? techs : ['General'];
  };

  const detectRepositoryUrl = (folderName: string): string => {
    const lowerName = folderName.toLowerCase();
    if (lowerName.includes('github')) {
      const match = folderName.match(/github\.com\/([^\/]+)/);
      if (match) return `https://github.com/${match[1]}`;
    }
    return '';
  };

  const generateDescription = (folderName: string): string => {
    return `A ${folderName} project managed in Developer OS`;
  };

  const handleScan = async () => {
    if (!path.trim()) return;
    setScanning(true);
    await new Promise((r) => setTimeout(r, 600));
    const folderName = path.split(/[\\/]/).filter(Boolean).pop() || 'Unknown';
    const technologies = detectTechnologies(folderName);
    const repositoryUrl = detectRepositoryUrl(folderName);
    const description = generateDescription(folderName);

    setResults([{
      path: path.trim(),
      name: folderName,
      technologies,
      description,
      repositoryUrl
    }]);
    setScanning(false);
  };

  const handleImport = (dir: ScanResult) => {
    navigate(PROJECT_FORM, {
      state: {
        name: dir.name,
        description: dir.description,
        tags: dir.technologies,
        technology: dir.technologies,
        repository_url: dir.repositoryUrl,
        local_path: dir.path,
        status: 'active'
      }
    });
    onClose();
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
                    onClick={() => handleImport(dir)}
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
