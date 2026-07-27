import { useState, useEffect, useCallback } from 'react';
import { FaCube, FaSync, FaExternalLinkAlt } from 'react-icons/fa';
import { toast } from 'sonner';
import LoadingComponent from '../../components/ui/feedback/LoadingComponent';
import { isTauri as isTauriRuntime } from '../../lib/tauri';
import { getProjectContext } from '../projects/utils/projectContext';

interface DepItem {
  name: string;
  current: string;
  latest?: string;
  outdated: boolean;
}

interface DepFile {
  path: string;
  type: 'npm' | 'cargo' | 'pip';
  deps: DepItem[];
}

const MOCK_DEPS: DepFile = {
  path: '/mock/project',
  type: 'npm',
  deps: [
    { name: 'react', current: '18.2.0', latest: '19.0.0', outdated: true },
    { name: 'typescript', current: '5.3.3', latest: '5.6.0', outdated: true },
    { name: 'vite', current: '5.0.0', latest: '5.4.0', outdated: true },
    { name: 'tailwindcss', current: '3.4.0', latest: '3.4.0', outdated: false },
    { name: 'zustand', current: '4.5.0', latest: '4.5.0', outdated: false },
    { name: 'react-router-dom', current: '6.21.0', latest: '6.21.0', outdated: false },
  ],
};

async function readPackageJson(path: string): Promise<DepFile | null> {
  try {
    const txt = await readFile(path + '/package.json');
    const json = JSON.parse(txt);
    const deps: DepItem[] = [];
    const all = { ...json.dependencies, ...json.devDependencies };
    for (const [name, version] of Object.entries(all)) {
      const v = String(version).replace(/^[^0-9]*/, '');
      deps.push({ name, current: v || String(version), outdated: false });
    }
    return { path, type: 'npm', deps };
  } catch { return null; }
}

async function readCargoToml(path: string): Promise<DepFile | null> {
  try {
    const txt = await readFile(path + '/Cargo.toml');
    const deps: DepItem[] = [];
    let inSection = false;
    for (const line of txt.split('\n')) {
      const tr = line.trim();
      if (tr.startsWith('[dependencies]')) { inSection = true; continue; }
      if (tr.startsWith('[')) { inSection = false; continue; }
      if (inSection && tr.includes('=')) {
        const [name, ver] = tr.split('=').map(s => s.trim().replace(/["\s]/g, ''));
        if (name && ver) deps.push({ name, current: ver, outdated: false });
      }
    }
    return { path, type: 'cargo', deps };
  } catch { return null; }
}

async function readRequirementsTxt(path: string): Promise<DepFile | null> {
  try {
    const txt = await readFile(path + '/requirements.txt');
    const deps: DepItem[] = [];
    for (const line of txt.split('\n')) {
      const tr = line.trim();
      if (!tr || tr.startsWith('#')) continue;
      const parts = tr.split(/[=<>~!]+/);
      deps.push({ name: parts[0].trim(), current: parts[1]?.trim() || '*', outdated: false });
    }
    return { path, type: 'pip', deps };
  } catch { return null; }
}

async function readFile(_path: string): Promise<string> {
  throw new Error('File reading only available in Tauri mode');
}

async function checkLatestNpm(name: string, current: string): Promise<DepItem> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`);
    if (!res.ok) return { name, current, outdated: false };
    const data = await res.json();
    return { name, current, latest: data.version, outdated: data.version !== current };
  } catch { return { name, current, outdated: false }; }
}

async function checkLatestCargo(name: string, current: string): Promise<DepItem> {
  try {
    const res = await fetch(`https://crates.io/api/v1/crates/${encodeURIComponent(name)}`);
    if (!res.ok) return { name, current, outdated: false };
    const data = await res.json();
    const latest = data.crate?.max_stable_version || current;
    return { name, current, latest, outdated: latest !== current };
  } catch { return { name, current, outdated: false }; }
}

const TYPE_LABELS: Record<string, string> = { npm: 'npm', cargo: 'Cargo', pip: 'pip' };
const TYPE_COLORS: Record<string, string> = { npm: 'text-red-400 bg-red-500/10', cargo: 'text-orange-400 bg-orange-500/10', pip: 'text-yellow-400 bg-yellow-500/10' };

export function DependenciesPage() {
  const [files, setFiles] = useState<DepFile[]>([]);
  const [scanning, setScanning] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [scanPath, setScanPath] = useState('');
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => { setIsTauri(isTauriRuntime()); }, []);

  const autoScan = useCallback(async () => {
    const ctx = getProjectContext();
    const basePath = ctx?.localPath || scanPath;
    if (!basePath) return;
    if (!isTauri) { setFiles([MOCK_DEPS]); return; }
    setScanning(true);
    setScanPath(basePath);
    try {
      const results = (await Promise.all([
        readPackageJson(basePath),
        readCargoToml(basePath),
        readRequirementsTxt(basePath),
      ])).filter(Boolean) as DepFile[];
      setFiles(results);
      if (results.length === 0) toast.error('No lockfiles found in project directory');
    } catch { toast.error('Failed to read project files'); }
    setScanning(false);
  }, [isTauri, scanPath]);

  useEffect(() => { autoScan(); }, [autoScan]);

  const resolveAll = async () => {
    setResolving(true);
    let count = 0;
    const updated = await Promise.all(files.map(async (f) => {
      const checked = await Promise.all(f.deps.map(async (d) => {
        try {
          if (f.type === 'npm') return await checkLatestNpm(d.name, d.current);
          if (f.type === 'cargo') return await checkLatestCargo(d.name, d.current);
          if (d.current !== '*') {
            const res = await fetch(`https://pypi.org/pypi/${encodeURIComponent(d.name)}/json`);
            if (res.ok) {
              const data = await res.json();
              const latest = data.info?.version || d.current;
              return { ...d, latest, outdated: latest !== d.current };
            }
          }
        } catch { /* skip */ }
        return { ...d, outdated: false };
      }));
      count += checked.filter(c => c.outdated).length;
      return { ...f, deps: checked };
    }));
    setFiles(updated);
    setResolving(false);
    toast.success(count > 0 ? `${count} outdated dependencies found` : 'All dependencies are up to date');
  };

  const totalDeps = files.reduce((s, f) => s + f.deps.length, 0);
  const outdatedCount = files.reduce((s, f) => s + f.deps.filter(d => d.outdated).length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FaCube className="w-6 h-6 text-theme-icon" />
          <div>
            <h1 className="text-2xl font-bold text-theme-text">Dependency Dashboard</h1>
            <p className="text-xs text-theme-text/40 mt-0.5">{isTauri ? 'Scan project lockfiles for outdated packages' : 'Demo mode — showing sample data'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isTauri && (
            <button onClick={() => setFiles([MOCK_DEPS])}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-theme-surface/50 border border-theme-border/20 rounded-xl hover:bg-theme-surface/80 transition-colors text-theme-text/70">
              <FaSync className="w-3 h-3" /> Load Demo
            </button>
          )}
          {files.length > 0 && (
            <button onClick={resolveAll} disabled={resolving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-theme-icon text-white rounded-xl hover:bg-theme-icon/90 transition-colors disabled:opacity-50">
              <FaSync className={`w-3.5 h-3.5 ${resolving ? 'animate-spin' : ''}`} /> {resolving ? 'Checking...' : 'Check for Updates'}
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      {files.length > 0 && (
        <div className="flex gap-4">
          <div className="bg-theme-surface border border-theme-border/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <FaCube className="w-5 h-5 text-theme-icon/50" />
            <div>
              <p className="text-2xl font-bold text-theme-text">{totalDeps}</p>
              <p className="text-[10px] text-theme-text/40">dependencies</p>
            </div>
          </div>
          <div className="bg-theme-surface border border-theme-border/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <FaSync className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-2xl font-bold text-yellow-400">{outdatedCount}</p>
              <p className="text-[10px] text-theme-text/40">outdated</p>
            </div>
          </div>
        </div>
      )}

      {scanning ? <LoadingComponent /> : files.length === 0 ? (
        <div className="text-center py-12">
          <FaCube className="w-10 h-10 text-theme-text/20 mx-auto mb-3" />
          <p className="text-sm font-medium text-theme-text/60">No dependencies found</p>
          <p className="text-xs text-theme-text/40 mt-1">{isTauri ? 'Open a project with package.json, Cargo.toml, or requirements.txt' : 'Click "Load Demo" to see sample data'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {files.map((f, fi) => (
            <div key={fi} className="bg-theme-surface border border-theme-border/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${TYPE_COLORS[f.type]}`}>{TYPE_LABELS[f.type]}</span>
                <span className="text-xs font-mono text-theme-text/40 truncate">{f.path}</span>
              </div>
              <div className="divide-y divide-theme-border/10">
                {f.deps.map(d => (
                  <div key={d.name} className="flex items-center gap-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-theme-text">{d.name}</p>
                      <p className="text-xs font-mono text-theme-text/40">v{d.current}{d.latest && d.latest !== d.current ? ` → v${d.latest}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {d.outdated ? (
                        <span className="px-2 py-0.5 text-[10px] font-medium text-yellow-400 bg-yellow-400/10 rounded">Update available</span>
                      ) : (
                        d.latest && <span className="px-2 py-0.5 text-[10px] font-medium text-green-400 bg-green-400/10 rounded">Up to date</span>
                      )}
                      <a href={`https://www.npmjs.com/package/${d.name}`} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-theme-text/30 hover:text-theme-icon transition-colors">
                        <FaExternalLinkAlt className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
