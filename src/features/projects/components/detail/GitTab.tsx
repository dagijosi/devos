import { useEffect, useState, useCallback } from 'react';
import { FaGitAlt, FaCodeBranch, FaPlus, FaCheck, FaRedo, FaHistory, FaFolderOpen } from 'react-icons/fa';
import { toast } from 'sonner';
import { isTauri } from '../../../../lib/tauri';

interface Props {
  localPath?: string;
}

interface GitFile {
  path: string;
  status: 'staged' | 'modified' | 'untracked' | 'deleted';
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

export function GitTab({ localPath }: Props) {
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<GitFile[]>([]);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [committing, setCommitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileDiff, setFileDiff] = useState('');
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => { setIsTauri(isTauri()); }, []);

  const runGit = useCallback(async (args: string[], cwd: string): Promise<string> => {
    const { Command } = await import('@tauri-apps/plugin-shell');
    const cmd = Command.create('git', args, { cwd });
    const result = await cmd.execute();
    if (result.code !== 0) throw new Error(result.stderr || result.stdout);
    return result.stdout;
  }, []);

  const loadRepo = useCallback(async (path: string) => {
    setLoading(true);
    try {
      const [filesOut, logOut, branchesOut] = await Promise.all([
        runGit(['status', '--porcelain'], path),
        runGit(['log', '--oneline', '--graph', '-n', 20, '--all', '--decorate'], path),
        runGit(['branch', '--all'], path),
      ]);
      setFiles(filesOut.split('\n').filter(Boolean).map(line => {
        const staged = line[0] !== ' ' && line[0] !== '?';
        const untracked = line.startsWith('??');
        const status: any = untracked ? 'untracked' : line[1] === 'M' ? 'modified' : line[1] === 'D' ? 'deleted' : 'modified';
        return { path: line.slice(3).trim(), status, staged };
      }));
      setCommits(logOut.split('\n').filter(Boolean).map(line => {
        const clean = line.replace(/^[*|/\\ ]+/, '').trim();
        const parts = clean.split(' ');
        return { hash: parts[0] || '', message: parts.slice(1).join(' ').replace(/\(.*\)/, '').trim(), author: 'Dev', date: '', refs: (clean.match(/\(.*\)/)?.[0] || '').replace(/[()]/g, '') };
      }));
      setBranches(branchesOut.split('\n').filter(Boolean).map(b => ({ name: b.replace('*', '').trim().replace('remotes/', ''), current: b.startsWith('*') })));
    } catch { /* not a git repo */ }
    setLoading(false);
  }, [runGit]);

  useEffect(() => { if (localPath) loadRepo(localPath); }, [localPath, loadRepo]);

  if (!isTauri || !localPath) {
    return (
      <div className="text-center py-12">
        <FaGitAlt className="w-10 h-10 text-theme-text/20 mx-auto mb-3" />
        <p className="text-sm text-theme-text/40">Git is only available in Tauri mode with a local project path</p>
        <p className="text-xs text-theme-text/30 mt-1">Set a local path for this project to enable git features</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8 text-xs text-theme-text/40">Loading git status...</div>;
  }

  if (files.length === 0 && commits.length === 0) {
    return (
      <div className="text-center py-12">
        <FaGitAlt className="w-10 h-10 text-theme-text/10 mx-auto mb-3" />
        <p className="text-sm text-theme-text/40">Not a git repository</p>
        <p className="text-xs text-theme-text/30 mt-1">Initialize git in {localPath} to use version control</p>
      </div>
    );
  }

  const stageFile = async (file: GitFile) => {
    try { await runGit(['add', file.path], localPath!); toast.success('Staged'); loadRepo(localPath!); }
    catch { toast.error('Failed to stage'); }
  };

  const unstageFile = async (file: GitFile) => {
    try { await runGit(['reset', 'HEAD', '--', file.path], localPath!); toast.success('Unstaged'); loadRepo(localPath!); }
    catch { toast.error('Failed to unstage'); }
  };

  const stageAll = async () => {
    try { await runGit(['add', '-A'], localPath!); toast.success('All changes staged'); loadRepo(localPath!); }
    catch { toast.error('Failed to stage all'); }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) return toast.error('Commit message required');
    setCommitting(true);
    try {
      await runGit(['commit', '-m', commitMessage], localPath!);
      toast.success('Committed');
      setCommitMessage('');
      loadRepo(localPath!);
    } catch (e: any) { toast.error(`Commit failed: ${e?.toString()}`); }
    setCommitting(false);
  };

  const viewDiff = async (file: GitFile) => {
    setSelectedFile(file.path);
    try {
      const diff = await runGit(['diff', file.staged ? '--staged' : '', '--', file.path].filter(Boolean), localPath!);
      setFileDiff(diff || '(no changes)');
    } catch { setFileDiff('(binary or large file)'); }
  };

  const checkoutBranch = async (name: string) => {
    try { await runGit(['checkout', name], localPath!); toast.success(`Switched to ${name}`); loadRepo(localPath!); }
    catch { toast.error('Checkout failed'); }
  };

  const stagedCount = files.filter(f => f.staged).length;
  const modifiedCount = files.filter(f => !f.staged && f.status !== 'untracked').length;
  const untrackedCount = files.filter(f => f.status === 'untracked').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="bg-theme-surface border border-theme-border/10 rounded-xl p-3">
        <h3 className="text-xs font-semibold text-theme-text/50 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <FaCodeBranch className="w-3 h-3" /> Branches
        </h3>
        <div className="space-y-1">
          {branches.map(b => (
            <div key={b.name} onClick={() => checkoutBranch(b.name)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                b.current ? 'bg-theme-icon/20 text-theme-icon font-medium' : 'text-theme-text/60 hover:bg-theme-surface/50 hover:text-theme-text'
              }`}>
              <FaCodeBranch className="w-3 h-3 shrink-0" />
              <span className="truncate">{b.name}</span>
              {b.current && <span className="ml-auto text-[10px] opacity-70">CURRENT</span>}
            </div>
          ))}
        </div>
        <h3 className="text-xs font-semibold text-theme-text/50 uppercase tracking-wider mt-5 mb-3 flex items-center gap-1.5">
          <FaHistory className="w-3 h-3" /> History
        </h3>
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

      <div className="lg:col-span-2 bg-theme-surface border border-theme-border/10 rounded-xl p-3 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-theme-text/50 uppercase tracking-wider">
            Changes ({stagedCount} staged, {modifiedCount} modified, {untrackedCount} untracked)
          </h3>
          <button onClick={stageAll} className="flex items-center gap-1 px-2 py-1 text-[10px] text-theme-text/50 hover:text-theme-text bg-theme-surface/50 rounded-lg transition-colors">
            <FaPlus className="w-2.5 h-2.5" /> Stage All
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-0.5 max-h-64">
          {files.map(file => (
            <div key={file.path} onClick={() => viewDiff(file)}
              className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                selectedFile === file.path ? 'bg-theme-surface/50' : 'hover:bg-theme-surface/30'
              }`}>
              {file.staged ? (
                <button onClick={e => { e.stopPropagation(); unstageFile(file); }} className="p-0.5 text-green-500 hover:text-green-400" title="Unstage">
                  <FaCheck className="w-3 h-3" />
                </button>
              ) : (
                <button onClick={e => { e.stopPropagation(); stageFile(file); }} className="p-0.5 text-theme-text/30 hover:text-theme-text/60" title="Stage">
                  <FaPlus className="w-3 h-3" />
                </button>
              )}
              <span className={`px-1 py-0.5 rounded text-[10px] font-mono ${
                file.staged ? 'bg-green-500/20 text-green-400' : file.status === 'untracked' ? 'bg-blue-500/20 text-blue-400' : file.status === 'deleted' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {file.staged ? 'STAGED' : file.status.toUpperCase()}
              </span>
              <span className={`truncate ${file.status === 'deleted' ? 'text-theme-text/30 line-through' : 'text-theme-text/80'}`}>{file.path}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-theme-border/10 space-y-2">
          <textarea value={commitMessage} onChange={e => setCommitMessage(e.target.value)}
            placeholder="Commit message..." rows={2}
            className="w-full px-3 py-2 bg-theme-background border border-theme-border/20 rounded-xl text-sm text-theme-text placeholder-theme-text/30 focus:outline-none focus:border-theme-icon/40 resize-none" />
          <button onClick={handleCommit} disabled={committing || stagedCount === 0}
            className="w-full py-2 text-xs font-medium bg-green-600/20 text-green-500 border border-green-600/30 rounded-xl hover:bg-green-600/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            {committing ? 'Committing...' : `Commit (${stagedCount} files)`}
          </button>
        </div>
      </div>

      <div className="bg-theme-surface border border-theme-border/10 rounded-xl p-3 overflow-y-auto max-h-96">
        <h3 className="text-xs font-semibold text-theme-text/50 uppercase tracking-wider mb-3">
          {selectedFile ? `Diff: ${selectedFile}` : 'Diff Viewer'}
        </h3>
        {fileDiff ? (
          <pre className="text-xs font-mono text-theme-text/80 whitespace-pre-wrap leading-relaxed">{fileDiff}</pre>
        ) : (
          <div className="flex items-center justify-center h-32 text-xs text-theme-text/30">
            {selectedFile ? 'Loading...' : 'Click a file to view diff'}
          </div>
        )}
      </div>
    </div>
  );
}
