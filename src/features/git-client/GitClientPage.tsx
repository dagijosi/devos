import { useEffect, useState, useCallback } from 'react';
import { FaGitAlt, FaCodeBranch, FaPlus, FaCheck, FaRedo, FaDownload, FaUpload, FaFolderOpen, FaHistory } from 'react-icons/fa';
import { toast } from 'sonner';
import LoadingComponent from '../../components/ui/feedback/LoadingComponent';
import { isTauri as isTauriRuntime } from '../../lib/tauri';

interface GitFile {
  path: string;
  status: 'staged' | 'modified' | 'untracked' | 'deleted' | 'renamed';
  staged: boolean;
}

interface GitBranch {
  name: string;
  current: boolean;
}

interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
  refs: string;
}

const DEMO_FILES: GitFile[] = [
  { path: 'src/App.tsx', status: 'modified', staged: false },
  { path: 'src/components/Header.tsx', status: 'modified', staged: true },
  { path: 'src/styles/index.css', status: 'modified', staged: false },
  { path: 'package.json', status: 'modified', staged: true },
  { path: 'new-feature.ts', status: 'untracked', staged: false },
  { path: 'temp.log', status: 'untracked', staged: false },
  { path: 'src/old-utils.ts', status: 'deleted', staged: false },
];

const DEMO_BRANCHES: GitBranch[] = [
  { name: 'main', current: true },
  { name: 'feature/auth', current: false },
  { name: 'fix/header-styles', current: false },
  { name: 'release/v2.0', current: false },
];

const DEMO_LOG = [
  { hash: 'a1b2c3d', message: 'Merge pull request #42 from feature/auth', author: 'Dev', date: '2h ago', refs: 'HEAD -> main, origin/main' },
  { hash: 'e4f5g6h', message: 'Add OAuth2 authentication flow', author: 'Dev', date: '3h ago', refs: '' },
  { hash: 'i7j8k9l', message: 'Fix header responsive styles', author: 'Dev', date: '5h ago', refs: 'origin/feature/auth' },
  { hash: 'm0n1o2p', message: 'Update dependencies', author: 'Dev', date: '1d ago', refs: '' },
  { hash: 'q3r4s5t', message: 'Initial commit', author: 'Dev', date: '3d ago', refs: 'tag: v1.0' },
];

export function GitClientPage() {
  const [isTauri, setIsTauri] = useState(false);
  const [isDemo, setIsDemo] = useState(true);
  const [repoPath, setRepoPath] = useState('');
  const [files, setFiles] = useState<GitFile[]>([]);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileDiff, setFileDiff] = useState('');
  const [loading, setLoading] = useState(true);
  const [committing, setCommitting] = useState(false);

  useEffect(() => {
    if (isTauriRuntime()) {
      setIsTauri(true);
      setIsDemo(false);
      setLoading(false);
    } else {
      setIsTauri(false);
      setIsDemo(true);
      setFiles(DEMO_FILES);
      setBranches(DEMO_BRANCHES);
      setCommits(DEMO_LOG);
      setLoading(false);
    }
  }, []);

  const runGit = useCallback(async (args: string[], cwd?: string): Promise<string> => {
    const { Command } = await import('@tauri-apps/plugin-shell');
    const cmd = Command.create('git', args, { cwd: cwd || repoPath });
    const result = await cmd.execute();
    if (result.code !== 0) throw new Error(result.stderr || result.stdout);
    return result.stdout;
  }, [repoPath]);

  const loadRepo = useCallback(async (path?: string) => {
    const dir = path || repoPath;
    if (!dir) return;
    setLoading(true);
    try {
      const [filesOut, logOut, branchesOut] = await Promise.all([
        runGit(['status', '--porcelain'], dir),
        runGit(['log', '--oneline', '--graph', '-n', '20', '--all', '--decorate'], dir),
        runGit(['branch', '--all'], dir),
      ]);

      const parsed = parseFiles(filesOut);
      setFiles(parsed);

      const parsedLog = parseLog(logOut);
      setCommits(parsedLog);

      const parsedBranches = branchesOut.split('\n')
        .filter(Boolean)
        .map((b) => ({
          name: b.replace('*', '').trim().replace('remotes/', ''),
          current: b.startsWith('*'),
        }));
      setBranches(parsedBranches);
    } catch (err: any) {
      toast.error(`Git error: ${err?.toString() || 'Unknown'}`);
    }
    setLoading(false);
  }, [repoPath, runGit]);

  const setRepo = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({ directory: true, multiple: false, title: 'Select Git Repository' });
      if (selected) {
        setRepoPath(selected as string);
        loadRepo(selected as string);
      }
    } catch {
      toast.error('Folder picker unavailable in browser mode');
    }
  };

  const parseFiles = (output: string): GitFile[] => {
    return output.split('\n')
      .filter(Boolean)
      .map((line) => {
        const staged = line[0] !== ' ' && line[0] !== '?';
        const untracked = line.startsWith('??');
        const modType = untracked ? 'untracked' :
          line[1] === 'M' ? 'modified' :
          line[1] === 'D' ? 'deleted' :
          line[1] === 'R' ? 'renamed' : 'modified';
        return {
          path: line.slice(3).trim(),
          status: untracked ? 'untracked' : modType,
          staged,
        };
      });
  };

  const parseLog = (output: string): GitCommit[] => {
    return output.split('\n')
      .filter(Boolean)
      .map((line) => {
        const clean = line.replace(/^[*|/\\ ]+/, '').trim();
        const parts = clean.split(' ');
        return {
          hash: parts[0] || '',
          message: parts.slice(1).join(' ').replace(/\(.*\)/, '').trim(),
          author: 'Dev',
          date: '',
          refs: (clean.match(/\(.*\)/)?.[0] || '').replace(/[()]/g, ''),
        };
      });
  };

  const stageFile = async (file: GitFile) => {
    if (isDemo) {
      setFiles((prev) => prev.map((f) => f.path === file.path ? { ...f, staged: true, status: f.status === 'untracked' ? 'modified' : f.status } : f));
      return;
    }
    await runGit(['add', file.path]);
    loadRepo();
  };

  const unstageFile = async (file: GitFile) => {
    if (isDemo) {
      setFiles((prev) => prev.map((f) => f.path === file.path ? { ...f, staged: false } : f));
      return;
    }
    await runGit(['reset', 'HEAD', '--', file.path]);
    loadRepo();
  };

  const stageAll = async () => {
    if (isDemo) {
      setFiles((prev) => prev.map((f) => f.status !== 'untracked' ? { ...f, staged: true } : f));
      return;
    }
    await runGit(['add', '-A']);
    loadRepo();
  };

  const commit = async () => {
    if (!commitMessage.trim()) {
      toast.error('Commit message is required');
      return;
    }
    if (isDemo) {
      toast.success('Demo commit created (not a real git commit)');
      setCommitMessage('');
      setFiles([]);
      return;
    }
    setCommitting(true);
    try {
      await runGit(['commit', '-m', commitMessage]);
      toast.success('Committed successfully');
      setCommitMessage('');
      loadRepo();
    } catch (err: any) {
      toast.error(`Commit failed: ${err?.toString() || 'Unknown error'}`);
    }
    setCommitting(false);
  };

  const viewDiff = async (file: GitFile) => {
    setSelectedFile(file.path);
    if (isDemo) {
      setFileDiff(`@@ -1,5 +1,8 @@\n-const oldCode = "removed";\n+const newCode = "added";\n+const extraLine = true;\n function existing() {\n   return "still here";\n }`);
      return;
    }
    try {
      const diff = await runGit(['diff', file.staged ? '--staged' : '', '--', file.path].filter(Boolean));
      setFileDiff(diff || '(no diff content)');
    } catch {
      setFileDiff('(binary or large file)');
    }
  };

  const checkoutBranch = async (name: string) => {
    if (isDemo) {
      setBranches((prev) => prev.map((b) => ({ ...b, current: b.name === name })));
      return;
    }
    try {
      await runGit(['checkout', name]);
      loadRepo();
    } catch (err: any) {
      toast.error(`Checkout failed: ${err?.toString() || 'Unknown error'}`);
    }
  };

  const gitPull = async () => {
    if (isDemo) { toast.info('Demo mode'); return; }
    try {
      await runGit(['pull']);
      toast.success('Pulled successfully');
      loadRepo();
    } catch (err: any) {
      toast.error(`Pull failed: ${err?.toString() || 'Unknown error'}`);
    }
  };

  const gitPush = async () => {
    if (isDemo) { toast.info('Demo mode'); return; }
    try {
      await runGit(['push']);
      toast.success('Pushed successfully');
    } catch (err: any) {
      toast.error(`Push failed: ${err?.toString() || 'Unknown error'}`);
    }
  };

  const stagedCount = files.filter((f) => f.staged).length;
  const modifiedCount = files.filter((f) => !f.staged && f.status !== 'untracked').length;
  const untrackedCount = files.filter((f) => f.status === 'untracked').length;

  if (loading) return <LoadingComponent />;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <FaGitAlt className="w-6 h-6 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold text-theme-text">Git Client</h1>
            <p className="text-xs text-theme-text/40 mt-0.5">
              {isDemo
                ? 'Demo mode — run `npm run tauri:dev` for real git operations'
                : repoPath || 'No repository selected'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isDemo && (
            <>
              <button onClick={setRepo} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-theme-surface/50 border border-theme-border/20 rounded-xl hover:bg-theme-surface/80 transition-colors text-theme-text/70">
                <FaFolderOpen className="w-3 h-3" /> Open Repo
              </button>
              <button onClick={gitPull} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-theme-surface/50 border border-theme-border/20 rounded-xl hover:bg-theme-surface/80 transition-colors text-theme-text/70">
                <FaDownload className="w-3 h-3" /> Pull
              </button>
              <button onClick={gitPush} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-theme-surface/50 border border-theme-border/20 rounded-xl hover:bg-theme-surface/80 transition-colors text-theme-text/70">
                <FaUpload className="w-3 h-3" /> Push
              </button>
            </>
          )}
          <button onClick={() => isTauri ? loadRepo() : setLoading(false)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-theme-surface/50 border border-theme-border/20 rounded-xl hover:bg-theme-surface/80 transition-colors text-theme-text/70">
            <FaRedo className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {/* Demo banner */}
      {isDemo && (
        <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-sm shrink-0">
          <FaCodeBranch className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Demo Mode — Sample Data</p>
            <p className="text-blue-400/70 mt-0.5">
              Open a repo with the folder picker, or run <code className="px-1 py-0.5 bg-blue-500/10 rounded text-xs">npm run tauri:dev</code> to work with real git repos.
            </p>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        {/* Branches */}
        <div className="bg-theme-surface/30 border border-theme-border/10 rounded-xl p-3 overflow-y-auto">
          <h2 className="text-xs font-semibold text-theme-text/50 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <FaCodeBranch className="w-3 h-3" /> Branches
          </h2>
          <div className="space-y-1">
            {branches.map((b) => (
              <div
                key={b.name}
                onClick={() => checkoutBranch(b.name)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                  b.current
                    ? 'bg-theme-icon/20 text-theme-icon font-medium'
                    : 'text-theme-text/60 hover:bg-theme-surface/50 hover:text-theme-text'
                }`}
              >
                <FaCodeBranch className="w-3 h-3 shrink-0" />
                <span className="truncate">{b.name}</span>
                {b.current && <span className="ml-auto text-[10px] opacity-70">CURRENT</span>}
              </div>
            ))}
          </div>

          <h2 className="text-xs font-semibold text-theme-text/50 uppercase tracking-wider mt-5 mb-3 flex items-center gap-1.5">
            <FaHistory className="w-3 h-3" /> History
          </h2>
          <div className="space-y-1.5">
            {commits.map((c, i) => (
              <div key={i} className="text-xs">
                <div className="flex items-center gap-2 text-theme-text/70">
                  <span className="font-mono text-theme-text/40">{c.hash.slice(0, 7)}</span>
                  <span className="truncate">{c.message}</span>
                </div>
                {c.refs && <span className="text-[10px] text-theme-icon ml-7">{c.refs}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Files */}
        <div className="lg:col-span-2 bg-theme-surface/30 border border-theme-border/10 rounded-xl p-3 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between shrink-0 mb-3">
            <h2 className="text-xs font-semibold text-theme-text/50 uppercase tracking-wider">
              Changes
              <span className="text-theme-text/30 font-normal ml-2">
                ({stagedCount} staged, {modifiedCount} modified, {untrackedCount} untracked)
              </span>
            </h2>
            <button onClick={stageAll} className="flex items-center gap-1 px-2 py-1 text-[10px] text-theme-text/50 hover:text-theme-text bg-theme-surface/50 rounded-lg transition-colors">
              <FaPlus className="w-2.5 h-2.5" /> Stage All
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-0.5">
            {files.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-theme-text/30">
                No changes — working tree clean
              </div>
            ) : (
              files.map((file) => (
                <div
                  key={file.path}
                  onClick={() => viewDiff(file)}
                  className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                    selectedFile === file.path ? 'bg-theme-surface/50' : 'hover:bg-theme-surface/30'
                  }`}
                >
                  {/* Stage/unstage */}
                  {file.staged ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); unstageFile(file); }}
                      className="p-0.5 text-green-500 hover:text-green-400"
                      title="Unstage"
                    >
                      <FaCheck className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); stageFile(file); }}
                      className="p-0.5 text-theme-text/30 hover:text-theme-text/60"
                      title="Stage"
                    >
                      <FaPlus className="w-3 h-3" />
                    </button>
                  )}

                  {/* Status badge */}
                  <span className={`px-1 py-0.5 rounded text-[10px] font-mono ${
                    file.staged ? 'bg-green-500/20 text-green-400' :
                    file.status === 'modified' ? 'bg-yellow-500/20 text-yellow-400' :
                    file.status === 'untracked' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {file.staged ? 'STAGED' : file.status.toUpperCase()}
                  </span>

                  {/* Path */}
                  <span className={`truncate ${file.status === 'deleted' ? 'text-theme-text/30 line-through' : 'text-theme-text/80'}`}>
                    {file.path}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Commit area */}
          <div className="shrink-0 mt-3 pt-3 border-t border-theme-border/10 space-y-2">
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Commit message..."
              rows={2}
              className="w-full px-3 py-2 bg-theme-surface/50 border border-theme-border/20 rounded-xl text-sm text-theme-text placeholder-theme-text/30 focus:outline-none focus:border-theme-icon/40 resize-none"
            />
            <button
              onClick={commit}
              disabled={committing || files.filter(f => f.staged).length === 0}
              className="w-full py-2 text-xs font-medium bg-green-600/20 text-green-500 border border-green-600/30 rounded-xl hover:bg-green-600/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {committing ? 'Committing...' : `Commit ${stagedCount > 0 ? `(${stagedCount} files)` : ''}`}
            </button>
          </div>
        </div>

        {/* Diff */}
        <div className="bg-theme-surface/30 border border-theme-border/10 rounded-xl p-3 overflow-y-auto">
          <h2 className="text-xs font-semibold text-theme-text/50 uppercase tracking-wider mb-3">
            {selectedFile ? `Diff: ${selectedFile}` : 'Diff Viewer'}
          </h2>
          {fileDiff ? (
            <pre className="text-xs font-mono text-theme-text/80 whitespace-pre-wrap leading-relaxed">
              {fileDiff}
            </pre>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-theme-text/30">
              {selectedFile ? 'Loading...' : 'Click a file to view diff'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
