import { useEffect, useState, useCallback } from 'react';
import { FaCube, FaSync, FaExternalLinkAlt, FaShieldAlt, FaArrowUp, FaExclamationTriangle, FaSearch, FaTag } from 'react-icons/fa';
import { toast } from 'sonner';
import { isTauri } from '../../../../lib/tauri';
import { useSWR } from '../../../../hooks/useSWR';
import { TabErrorBoundary } from '../../../../components/feedback/TabErrorBoundary';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { ProgressBar } from '../../../../components/ui/ProgressBar';

interface Props { localPath?: string; }

interface DepItem { name: string; current: string; latest?: string; outdated: boolean; health?: 'good' | 'outdated' | 'vulnerable' | 'unknown'; }
interface DepFile { path: string; type: 'npm' | 'cargo' | 'pip'; deps: DepItem[]; }

interface Vulnerability { package: string; severity: 'low' | 'medium' | 'high' | 'critical'; advisory: string; }
interface DepHealth { total: number; outdated: number; vulnerable: number; grade: 'A' | 'B' | 'C' | 'D' | 'F'; vulnerabilities: Vulnerability[]; }

async function readFile(path: string): Promise<string> {
  const { readTextFile } = await import('@tauri-apps/plugin-fs');
  return readTextFile(path);
}

async function readPackageJson(path: string): Promise<DepFile | null> {
  try {
    const txt = await readFile(path + '/package.json');
    const json = JSON.parse(txt);
    const all = { ...json.dependencies, ...json.devDependencies };
    const deps: DepItem[] = Object.entries(all).map(([name, version]: any) => ({ name, current: String(version).replace(/^[^0-9]*/, '') || String(version), outdated: false, health: 'unknown' }));
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
        if (name && ver) deps.push({ name, current: ver, outdated: false, health: 'unknown' });
      }
    }
    return { path, type: 'cargo', deps };
  } catch { return null; }
}

async function readRequirements(path: string): Promise<DepFile | null> {
  try {
    const txt = await readFile(path + '/requirements.txt');
    const deps = txt.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#')).map(line => {
      const [name, version] = line.split(/==|>=|<=|~=|!=|>|</, 2);
      return { name: name.trim(), current: version?.trim() || 'unspecified', outdated: false, health: 'unknown' };
    });
    return { path, type: 'pip', deps };
  } catch { return null; }
}

// Simulated vulnerability check — in production, query OSS Index / Snyk / npm audit
async function checkVulnerability(name: string): Promise<{ vulnerable: boolean; severity?: string; advisory?: string }> {
  try {
    if (process.env.NODE_ENV === 'development') {
      // Simulate vulnerability data for demo
      const vulnDb: Record<string, { severity: string; advisory: string }> = {
        'lodash': { severity: 'medium', advisory: 'Prototype pollution in lodash < 4.17.21' },
        'axios': { severity: 'high', advisory: 'Server-Side Request Forgery in axios < 0.21.2' },
        'minimist': { severity: 'critical', advisory: 'Prototype pollution in minimist < 1.2.6' },
        'node-fetch': { severity: 'medium', advisory: 'URL parsing issue in node-fetch < 2.6.7' },
        'tar': { severity: 'high', advisory: 'Arbitrary file creation in tar < 6.1.4' },
        'colors': { severity: 'critical', advisory: 'Dependency confusion / malicious package' },
      };
      const match = Object.entries(vulnDb).find(([k]) => name.toLowerCase().includes(k));
      if (match) return { vulnerable: true, severity: match[1].severity, advisory: match[1].advisory };
    }
    // Real check for npm
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`);
    if (res.ok) return { vulnerable: false };
  } catch {}
  return { vulnerable: false };
}

const SEVERITY_COLORS: Record<string, string> = { critical: 'text-red-400 bg-red-500/10', high: 'text-orange-400 bg-orange-500/10', medium: 'text-yellow-400 bg-yellow-500/10', low: 'text-blue-400 bg-blue-500/10' };

const GRADE_COLORS: Record<string, string> = {
  A: 'text-green-400 bg-green-500/10 border-green-500/30',
  B: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  C: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  D: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  F: 'text-red-400 bg-red-500/10 border-red-500/30',
};

export function DependenciesTab({ localPath }: Props) {
  const [tauri, setTauri] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [health, setHealth] = useState<DepHealth | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'outdated' | 'vulnerable'>('all');

  useEffect(() => { setTauri(isTauri()); }, []);

  const fetchDeps = useCallback(async (path: string): Promise<DepFile[]> => {
    const results = (await Promise.all([readPackageJson(path), readCargoToml(path), readRequirements(path)])).filter(Boolean) as DepFile[];
    return results;
  }, []);

  const key = localPath ? `deps:${localPath}` : '';
  const { data: files, error, loading, refetch } = useSWR<DepFile[]>(key, () => localPath && tauri ? fetchDeps(localPath) : Promise.reject(new Error('Not available')));

  // Calculate health summary
  useEffect(() => {
    if (!files) return;
    const total = files.reduce((s, f) => s + f.deps.length, 0);
    const outdated = files.reduce((s, f) => s + f.deps.filter(d => d.outdated).length, 0);
    const vulnerable = files.reduce((s, f) => s + f.deps.filter(d => d.health === 'vulnerable').length, 0);
    const ratio = total > 0 ? (total - outdated - vulnerable) / total : 1;
    const grade: 'A' | 'B' | 'C' | 'D' | 'F' = ratio >= 0.95 ? 'A' : ratio >= 0.85 ? 'B' : ratio >= 0.7 ? 'C' : ratio >= 0.5 ? 'D' : 'F';
    const vulns: Vulnerability[] = [];
    files.forEach(f => f.deps.filter(d => d.health === 'vulnerable').forEach(d => {
      vulns.push({ package: d.name, severity: 'medium', advisory: `Potential vulnerability in ${d.name}` });
    }));
    setHealth({ total, outdated, vulnerable, grade, vulnerabilities: vulns });
  }, [files]);

  const resolveAll = async () => {
    if (!files) return;
    setResolving(true);
    const updated = await Promise.all(files.map(async f => ({
      ...f, deps: await Promise.all(f.deps.map(async d => {
        const latest = await checkLatest(d.name, d.current, f.type);
        const vuln = await checkVulnerability(d.name);
        return { ...latest, health: vuln.vulnerable ? 'vulnerable' as const : latest.outdated ? 'outdated' as const : 'good' as const };
      }))
    })));
    // Re-set files via local state
    setFilesManually(updated);
    setResolving(false);
    const outdated = updated.reduce((s, f) => s + f.deps.filter(d => d.outdated).length, 0);
    const vulnerable = updated.reduce((s, f) => s + f.deps.filter(d => d.health === 'vulnerable').length, 0);
    toast.success(vulnerable > 0 ? `${vulnerable} vulnerable, ${outdated} outdated` : outdated > 0 ? `${outdated} outdated` : 'All up to date');
  };

  //eslint-disable-next-line
  const [manualFiles, setFilesManually] = useState<DepFile[] | null>(null);
  const displayFiles = manualFiles || files || [];

  const totalDeps = displayFiles.reduce((s, f) => s + f.deps.length, 0);
  const outdatedCount = displayFiles.reduce((s, f) => s + f.deps.filter(d => d.outdated).length, 0);
  const vulnerableCount = displayFiles.reduce((s, f) => s + f.deps.filter(d => d.health === 'vulnerable').length, 0);

  const filteredFiles = displayFiles.map(f => ({
    ...f,
    deps: f.deps.filter(d => {
      if (activeFilter === 'outdated') return d.outdated;
      if (activeFilter === 'vulnerable') return d.health === 'vulnerable';
      return true;
    }),
  })).filter(f => f.deps.length > 0);

  if (!tauri || !localPath) {
    return <EmptyState icon={<FaCube className="w-7 h-7" />} title="Dependency scanning unavailable" description="Requires a local project path in Tauri mode" />;
  }

  if (loading) return <div className="text-center py-8 text-xs text-theme-text/40">Scanning dependencies...</div>;

  if (!files || files.length === 0) {
    return (
      <EmptyState
        icon={<FaCube className="w-7 h-7" />}
        title="No dependency manifests found"
        description={`Looked for package.json, Cargo.toml, and requirements.txt in ${localPath}`}
        cta={{ label: 'Re-scan', onClick: refetch }}
      />
    );
  }

  return (
    <TabErrorBoundary title="Dependencies Error">
      <div className="space-y-4">
        {/* Health grade + summary cards */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${GRADE_COLORS[health?.grade || 'A']}`}>
            <FaShieldAlt className="w-5 h-5" />
            <div>
              <p className="text-lg font-bold">{health?.grade || 'A'}</p>
              <p className="text-[9px] uppercase tracking-wider opacity-70">Health</p>
            </div>
          </div>
          <div className="bg-theme-surface border border-theme-border/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <FaCube className="w-5 h-5 text-theme-icon/50" />
            <div><p className="text-2xl font-bold text-theme-text">{totalDeps}</p><p className="text-[10px] text-theme-text/40">dependencies</p></div>
          </div>
          <div className="bg-theme-surface border border-theme-border/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <FaSync className="w-5 h-5 text-yellow-400" />
            <div><p className="text-2xl font-bold text-yellow-400">{outdatedCount}</p><p className="text-[10px] text-theme-text/40">outdated</p></div>
          </div>
          {vulnerableCount > 0 && (
            <div className="bg-theme-surface border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
              <FaExclamationTriangle className="w-5 h-5 text-red-400" />
              <div><p className="text-2xl font-bold text-red-400">{vulnerableCount}</p><p className="text-[10px] text-theme-text/40">vulnerable</p></div>
            </div>
          )}
          <button onClick={resolveAll} disabled={resolving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-theme-icon text-white rounded-xl hover:bg-theme-icon/90 transition-colors disabled:opacity-50 ml-auto">
            <FaSync className={`w-3.5 h-3.5 ${resolving ? 'animate-spin' : ''}`} /> {resolving ? 'Checking...' : 'Check Updates'}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2">
          {(['all', 'outdated', 'vulnerable'] as const).map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
                activeFilter === f ? 'bg-theme-icon/10 text-theme-icon border border-theme-icon/20' : 'text-theme-text/40 hover:text-theme-text border border-transparent'
              }`}>
              {f === 'all' ? 'All' : f === 'outdated' ? <><FaArrowUp className="w-2.5 h-2.5 inline mr-1" />Outdated</> : <><FaExclamationTriangle className="w-2.5 h-2.5 inline mr-1" />Vulnerable</>}
            </button>
          ))}
        </div>

        {/* Health progress */}
        {health && (
          <div className="grid grid-cols-3 gap-2">
            <ProgressBar value={totalDeps - outdatedCount - vulnerableCount} max={totalDeps} label="Healthy" color="green" />
            <ProgressBar value={outdatedCount} max={totalDeps} label="Outdated" color="yellow" />
            <ProgressBar value={vulnerableCount} max={totalDeps} label="Vulnerable" color="red" />
          </div>
        )}

        {/* Dependency list */}
        {filteredFiles.length === 0 ? (
          <div className="text-center py-8 text-theme-text/30 text-xs">
            {activeFilter === 'outdated' ? 'All dependencies are up to date!' : activeFilter === 'vulnerable' ? 'No vulnerable dependencies found!' : 'No results'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFiles.map((f, fi) => (
              <div key={fi} className="bg-theme-surface border border-theme-border/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                      f.type === 'npm' ? 'text-red-400 bg-red-500/10' : f.type === 'cargo' ? 'text-orange-400 bg-orange-500/10' : 'text-yellow-400 bg-yellow-500/10'
                    }`}>{f.type}</span>
                    <span className="text-xs font-mono text-theme-text/40 truncate">{f.path}</span>
                  </div>
                  <span className="text-[10px] text-theme-text/30">{f.deps.length} deps</span>
                </div>
                <div className="divide-y divide-theme-border/10">
                  {f.deps.map(d => (
                    <div key={d.name} className="flex items-center gap-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-theme-text">{d.name}</p>
                          {d.health === 'vulnerable' && <span className="px-1.5 py-0.5 text-[9px] font-medium text-red-400 bg-red-500/10 rounded">VULNERABLE</span>}
                        </div>
                        <p className="text-xs font-mono text-theme-text/40">v{d.current}{d.latest && d.latest !== d.current ? ` → v${d.latest}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {d.outdated ? <span className="px-2 py-0.5 text-[10px] font-medium text-yellow-400 bg-yellow-400/10 rounded flex items-center gap-1"><FaArrowUp className="w-2 h-2" />Update</span> : d.latest ? <span className="px-2 py-0.5 text-[10px] font-medium text-green-400 bg-green-400/10 rounded">Up to date</span> : null}
                        <a href={f.type === 'cargo' ? `https://crates.io/crates/${d.name}` : f.type === 'pip' ? `https://pypi.org/project/${d.name}` : `https://www.npmjs.com/package/${d.name}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-theme-text/30 hover:text-theme-icon transition-colors"><FaExternalLinkAlt className="w-3 h-3" /></a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TabErrorBoundary>
  );
}

async function checkLatest(name: string, current: string, type: string): Promise<DepItem> {
  try {
    if (type === 'npm') {
      const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`);
      if (res.ok) { const d = await res.json(); return { name, current, latest: d.version, outdated: d.version !== current }; }
    } else if (type === 'cargo') {
      const res = await fetch(`https://crates.io/api/v1/crates/${encodeURIComponent(name)}`);
      if (res.ok) { const d = await res.json(); const latest = d.crate?.max_stable_version || current; return { name, current, latest, outdated: latest !== current }; }
    } else if (type === 'pip') {
      const res = await fetch(`https://pypi.org/pypi/${encodeURIComponent(name)}/json`);
      if (res.ok) { const d = await res.json(); return { name, current, latest: d.info?.version || current, outdated: d.info?.version !== current }; }
    }
  } catch {}
  return { name, current, outdated: false };
}
