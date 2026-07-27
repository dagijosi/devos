import { useEffect, useState, useCallback } from 'react';
import { FaCube, FaSync, FaExternalLinkAlt } from 'react-icons/fa';
import { toast } from 'sonner';
import { isTauri } from '../../../../lib/tauri';

interface Props {
  localPath?: string;
}

interface DepItem { name: string; current: string; latest?: string; outdated: boolean; }
interface DepFile { path: string; type: 'npm' | 'cargo' | 'pip'; deps: DepItem[]; }

async function readFile(path: string): Promise<string> {
  const { readTextFile } = await import('@tauri-apps/plugin-fs');
  return readTextFile(path);
}

async function readPackageJson(path: string): Promise<DepFile | null> {
  try {
    const txt = await readFile(path + '/package.json');
    const json = JSON.parse(txt);
    const all = { ...json.dependencies, ...json.devDependencies };
    const deps: DepItem[] = Object.entries(all).map(([name, version]: any) => ({ name, current: String(version).replace(/^[^0-9]*/, '') || String(version), outdated: false }));
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

async function checkLatest(name: string, current: string, type: string): Promise<DepItem> {
  try {
    if (type === 'npm') {
      const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`);
      if (res.ok) { const d = await res.json(); return { name, current, latest: d.version, outdated: d.version !== current }; }
    } else if (type === 'cargo') {
      const res = await fetch(`https://crates.io/api/v1/crates/${encodeURIComponent(name)}`);
      if (res.ok) { const d = await res.json(); const latest = d.crate?.max_stable_version || current; return { name, current, latest, outdated: latest !== current }; }
    }
  } catch {}
  return { name, current, outdated: false };
}

const TYPE_LABELS: Record<string, string> = { npm: 'npm', cargo: 'Cargo', pip: 'pip' };
const TYPE_COLORS: Record<string, string> = { npm: 'text-red-400 bg-red-500/10', cargo: 'text-orange-400 bg-orange-500/10', pip: 'text-yellow-400 bg-yellow-500/10' };

export function DependenciesTab({ localPath }: Props) {
  const [files, setFiles] = useState<DepFile[]>([]);
  const [scanning, setScanning] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [tauri, setTauri] = useState(false);

  useEffect(() => { setTauri(isTauri()); }, []);

  const scan = useCallback(async () => {
    if (!localPath || !tauri) return;
    setScanning(true);
    try {
      const results = (await Promise.all([readPackageJson(localPath), readCargoToml(localPath)])).filter(Boolean) as DepFile[];
      setFiles(results);
      if (results.length === 0) toast.error('No lockfiles found');
    } catch { toast.error('Failed to read files'); }
    setScanning(false);
  }, [localPath, tauri]);

  useEffect(() => { scan(); }, [scan]);

  const resolveAll = async () => {
    setResolving(true);
    const updated = await Promise.all(files.map(async f => ({
      ...f, deps: await Promise.all(f.deps.map(d => checkLatest(d.name, d.current, f.type)))
    })));
    setFiles(updated);
    setResolving(false);
    const outdated = updated.reduce((s, f) => s + f.deps.filter(d => d.outdated).length, 0);
    toast.success(outdated > 0 ? `${outdated} outdated` : 'All up to date');
  };

  const totalDeps = files.reduce((s, f) => s + f.deps.length, 0);
  const outdatedCount = files.reduce((s, f) => s + f.deps.filter(d => d.outdated).length, 0);

  if (!tauri || !localPath) {
    return (
      <div className="text-center py-12">
        <FaCube className="w-10 h-10 text-theme-text/20 mx-auto mb-3" />
        <p className="text-sm text-theme-text/40">Dependency scanning requires a local path</p>
      </div>
    );
  }

  if (scanning) return <div className="text-center py-8 text-xs text-theme-text/40">Scanning...</div>;

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <FaCube className="w-10 h-10 text-theme-text/20 mx-auto mb-3" />
        <p className="text-sm text-theme-text/40">No lockfiles found</p>
        <p className="text-xs text-theme-text/30 mt-1">Looked for package.json, Cargo.toml in {localPath}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="bg-theme-surface border border-theme-border/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <FaCube className="w-5 h-5 text-theme-icon/50" />
          <div><p className="text-2xl font-bold text-theme-text">{totalDeps}</p><p className="text-[10px] text-theme-text/40">dependencies</p></div>
        </div>
        <div className="bg-theme-surface border border-theme-border/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <FaSync className="w-5 h-5 text-yellow-400" />
          <div><p className="text-2xl font-bold text-yellow-400">{outdatedCount}</p><p className="text-[10px] text-theme-text/40">outdated</p></div>
        </div>
        <button onClick={resolveAll} disabled={resolving}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-theme-icon text-white rounded-xl hover:bg-theme-icon/90 transition-colors disabled:opacity-50 ml-auto">
          <FaSync className={`w-3.5 h-3.5 ${resolving ? 'animate-spin' : ''}`} /> {resolving ? 'Checking...' : 'Check Updates'}
        </button>
      </div>

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
                    {d.outdated ? <span className="px-2 py-0.5 text-[10px] font-medium text-yellow-400 bg-yellow-400/10 rounded">Update available</span> : d.latest ? <span className="px-2 py-0.5 text-[10px] font-medium text-green-400 bg-green-400/10 rounded">Up to date</span> : null}
                    <a href={`https://www.npmjs.com/package/${d.name}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-theme-text/30 hover:text-theme-icon transition-colors"><FaExternalLinkAlt className="w-3 h-3" /></a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
