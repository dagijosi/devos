import { useEffect, useState, useCallback } from 'react';
import { FaGitAlt, FaCodeBranch, FaPlus, FaCheck, FaHistory, FaArrowDown, FaArrowUp, FaBox, FaExclamationTriangle, FaCheckDouble, FaTrash } from 'react-icons/fa';
import { toast } from 'sonner';
import { useSWR } from '../../../../hooks/useSWR';
import { TabErrorBoundary } from '../../../../components/feedback/TabErrorBoundary';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { ProgressBar } from '../../../../components/ui/ProgressBar';

interface Props { localPath?: string; }

interface GitFile { path: string; status: 'staged' | 'modified' | 'untracked' | 'deleted' | 'conflict'; staged: boolean; }
interface GitBranch { name: string; current: boolean; }
interface GitCommit { hash: string; message: string; author: string; date: string; refs: string; }
interface GitStash { id: number; message: string; date: string; }
interface GitStatus { files: GitFile[]; ahead: number; behind: number; branches: GitBranch[]; commits: GitCommit[]; stashes: GitStash[]; currentBranch: string; }

export function GitTab({ localPath }: Props) {
  const [isTauriEnv, setIsTauri] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [committing, setCommitting] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileDiff, setFileDiff] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [stashMessage, setStashMessage] = useState('');
  const [showStashForm, setShowStashForm] = useState(false);
  const [conflictFiles, setConflictFiles] = useState<string[]>([]);

  useEffect(() => { setIsTauri(typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined); }, []);

  const runGit = useCallback(async (args: string[], cwd: string): Promise<string> => {
    const { Command } = await import('@tauri-apps/plugin-shell');
    const cmd = Command.create('git', args, { cwd });
    const result = await cmd.execute();
    if (result.code !== 0) throw new Error(result.stderr || result.stdout);
    return result.stdout;
  }, []);

  const fetchStatus = useCallback(async (path: string): Promise<GitStatus> => {
    const [filesOut, logOut, branchesOut, stashOut, remoteOut] = await Promise.all([
      runGit(['status', '--porcelain'], path),
      runGit(['log', '--oneline', '--graph', '-n', '25', '--all', '--decorate'], path),
      runGit(['branch', '--all'], path),
      runGit(['stash', 'list'], path).catch(() => ''),
      runGit(['rev-list', '--left-right', '--count', 'HEAD...@{upstream}'], path).catch(() => ''),
    ]);

    const files: GitFile[] = filesOut.split('\n').filter(Boolean).map(line => {
      const isConflict = line.startsWith('UU') || line.startsWith('AA') || line.startsWith('DD');
      const staged = line[0] !== ' ' && line[0] !== '?' && !isConflict;
      const untracked = line.startsWith('??');
      const status: GitFile['status'] = isConflict ? 'conflict' : untracked ? 'untracked' : staged ? 'staged' : line[1] === 'M' ? 'modified' : line[1] === 'D' ? 'deleted' : 'modified';
      return { path: line.slice(3).trim(), status, staged };
    });

    setConflictFiles(files.filter(f => f.status === 'conflict').map(f => f.path));

    const commits: GitCommit[] = logOut.split('\n').filter(Boolean).map(line => {
      const clean = line.replace(/^[*|/\\ ]+/, '').trim();
      const parts = clean.split(' ');
      return { hash: parts[0] || '', message: parts.slice(1).join(' ').replace(/\(.*\)/, '').trim(), author: 'Dev', date: '', refs: (clean.match(/\(.*\)/)?.[0] || '').replace(/[()]/g, '') };
    });

    const branches: GitBranch[] = branchesOut.split('\n').filter(Boolean).map(b => ({ name: b.replace('*', '').trim().replace('remotes/', ''), current: b.startsWith('*') }));
    const currentBranch = branches.find(b => b.current)?.name || 'main';

    const stashes: GitStash[] = stashOut.split('\n').filter(Boolean).map((line, i) => {
      const match = line.match(/^stash@\{(\d+)\}:\s*(?:.*?):\s*(.+)$/);
      return { id: i, message: match?.[2] || line, date: '' };
    });

    let ahead = 0; let behind = 0;
    if (remoteOut) {
      const parts = remoteOut.trim().split('\t');
      if (parts.length >= 2) { ahead = parseInt(parts[0]) || 0; behind = parseInt(parts[1]) || 0; }
    }

    return { files, ahead, behind, branches, commits, stashes, currentBranch };
  }, [runGit]);

  const key = localPath ? `git:${localPath}` : '';
  const { data: status, error, loading, refetch } = useSWR<GitStatus>(key, () => localPath ? fetchStatus(localPath) : Promise.reject(new Error('No path')));

  const stageFile = async (file: GitFile) => {
    try { await runGit(['add', file.path], localPath!); toast.success('Staged'); refetch(); } catch { toast.error('Failed to stage'); }
  };
  const unstageFile = async (file: GitFile) => {
    try { await runGit(['reset', 'HEAD', '--', file.path], localPath!); toast.success('Unstaged'); refetch(); } catch { toast.error('Failed to unstage'); }
  };
  const stageAll = async () => {
    try { await runGit(['add', '-A'], localPath!); toast.success('All changes staged'); refetch(); } catch { toast.error('Failed to stage all'); }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) return toast.error('Commit message required');
    setCommitting(true);
    try {
      await runGit(['commit', '-m', commitMessage], localPath!);
      toast.success('Committed');
      setCommitMessage('');
      refetch();
    } catch (e: any) { toast.error(`Commit failed: ${e?.toString()}`); }
    setCommitting(false);
  };

  const handlePush = async () => {
    setPushing(true);
    try {
      await runGit(['push'], localPath!);
      toast.success('Pushed');
      refetch();
    } catch (e: any) { toast.error(`Push failed: ${e?.toString()}`); }
    setPushing(false);
  };

  const handlePull = async () => {
    setPulling(true);
    try {
      const stashed = status!.files.length > 0;
      if (stashed) await runGit(['stash', 'push', '-m', 'auto-stash before pull'], localPath!);
      await runGit(['pull', '--rebase'], localPath!);
      if (stashed) await runGit(['stash', 'pop'], localPath!);
      toast.success('Pulled');
      refetch();
    } catch (e: any) { toast.error(`Pull failed: ${e?.toString()}`); }
    setPulling(false);
  };

  const viewDiff = async (file: GitFile) => {
    setSelectedFile(file.path);
    try {
      const diff = await runGit(['diff', file.staged ? '--staged' : '', '--', file.path].filter(Boolean), localPath!);
      setFileDiff(diff || '(no changes)');
    } catch { setFileDiff('(binary or large file)'); }
  };

  const checkoutBranch = async (name: string) => {
    const current = status?.branches.find(b => b.current);
    if (current?.name === name) return;
    try { await runGit(['checkout', name], localPath!); toast.success(`Switched to ${name}`); refetch(); }
    catch { toast.error('Checkout failed'); }
  };

  const createBranch = async () => {
    if (!newBranchName.trim()) return;
    try {
      await runGit(['checkout', '-b', newBranchName.trim()], localPath!);
      toast.success(`Created ${newBranchName}`);
      setNewBranchName(''); setShowBranchForm(false);
      refetch();
    } catch { toast.error('Branch creation failed'); }
  };

  const stash = async () => {
    try {
      await runGit(['stash', 'push', '-u', '-m', stashMessage.trim() || 'auto-stash'], localPath!);
      toast.success('Stashed');
      setStashMessage(''); setShowStashForm(false);
      refetch();
    } catch { toast.error('Stash failed'); }
  };

  const stashPop = async (id?: number) => {
    try {
      if (id !== undefined) await runGit(['stash', 'apply', `stash@{${id}}`], localPath!);
      else await runGit(['stash', 'pop'], localPath!);
      toast.success('Stash applied');
      refetch();
    } catch { toast.error('Failed to apply stash'); }
  };

  const stashDrop = async (id: number) => {
    try { await runGit(['stash', 'drop', `stash@{${id}}`], localPath!); toast.success('Stash dropped'); refetch(); }
    catch { toast.error('Failed to drop stash'); }
  };

  const resolveConflict = async (file: string, strategy: 'ours' | 'theirs') => {
    try {
      const { Command } = await import('@tauri-apps/plugin-shell');
      const cmd = Command.create('git', [strategy === 'ours' ? 'checkout' : 'checkout', `--${strategy}`, file], { cwd: localPath! });
      await cmd.execute();
      await runGit(['add', file], localPath!);
      toast.success(`Resolved using ${strategy}`);
      refetch();
    } catch { toast.error('Failed to resolve'); }
  };

  if (!isTauriEnv || !localPath) {
    return <EmptyState icon={<FaGitAlt className="w-7 h-7" />} title="Git unavailable" description="Git is only available in Tauri mode with a local project path" />;
  }

  if (loading) return <div className="text-center py-8 text-xs text-theme-text/40">Loading git status...</div>;

  if (error || !status || (status.files.length === 0 && status.commits.length === 0 && status.branches.length === 0)) {
    return (
      <EmptyState
        icon={<FaGitAlt className="w-7 h-7" />}
        title={error ? 'Failed to load' : 'Not a git repository'}
        description={error ? error.message : `No git repo found at ${localPath}`}
        cta={error ? { label: 'Retry', onClick: refetch } : undefined}
      />
    );
  }

  const stagedCount = status.files.filter(f => f.staged).length;
  const modifiedCount = status.files.filter(f => !f.staged && f.status === 'modified').length;
  const untrackedCount = status.files.filter(f => f.status === 'untracked').length;
  const conflictCount = status.files.filter(f => f.status === 'conflict').length;

  return (
    <TabErrorBoundary title="Git Error">
      {/* Conflict banner */}
      {conflictCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <FaExclamationTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">{conflictCount} conflicted file{conflictCount > 1 ? 's' : ''}</span>
          </div>
          <p className="text-xs text-theme-text/60 mb-3">Resolve conflicts before committing</p>
          <div className="space-y-1.5">
            {conflictFiles.map(f => (
              <div key={f} className="flex items-center gap-2 text-xs">
                <span className="flex-1 font-mono text-theme-text/80">{f}</span>
                <button onClick={() => resolveConflict(f, 'ours')} className="px-2 py-0.5 text-[10px] bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20">Use ours</button>
                <button onClick={() => resolveConflict(f, 'theirs')} className="px-2 py-0.5 text-[10px] bg-green-500/10 text-green-400 rounded hover:bg-green-500/20">Use theirs</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sync bar */}
      {status.currentBranch && (
        <div className="flex items-center gap-2 mb-4 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-surface border border-theme-border/20 rounded-lg">
            <FaCodeBranch className="w-3 h-3 text-theme-icon" />
            <span className="font-medium text-theme-text">{status.currentBranch}</span>
          </div>
          {(status.ahead > 0 || status.behind > 0) && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-theme-surface border border-theme-border/20 rounded-lg text-theme-text/60">
              {status.ahead > 0 && <span className="flex items-center gap-1"><FaArrowUp className="w-2.5 h-2.5 text-green-400" />{status.ahead}</span>}
              {status.behind > 0 && <span className="flex items-center gap-1"><FaArrowDown className="w-2.5 h-2.5 text-blue-400" />{status.behind}</span>}
            </div>
          )}
          <button onClick={handlePull} disabled={pulling}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-50">
            {pulling ? '...' : <><FaArrowDown className="w-2.5 h-2.5" /> Pull</>}
          </button>
          <button onClick={handlePush} disabled={pushing || status.ahead === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors disabled:opacity-50">
            {pushing ? '...' : <><FaArrowUp className="w-2.5 h-2.5" /> Push</>}
          </button>
          <button onClick={() => setShowBranchForm(true)} className="px-3 py-1.5 text-xs bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors">
            <FaPlus className="w-2.5 h-2.5 inline mr-1" /> Branch
          </button>
          <button onClick={() => setShowStashForm(true)} className="px-3 py-1.5 text-xs bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors">
            <FaBox className="w-2.5 h-2.5 inline mr-1" /> Stash
          </button>
        </div>
      )}

      {/* Branch creation form */}
      {showBranchForm && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-theme-surface border border-theme-border/20 rounded-xl">
          <input value={newBranchName} onChange={e => setNewBranchName(e.target.value)}
            placeholder="Branch name" autoFocus
            className="flex-1 bg-theme-background border border-theme-border/30 rounded-lg px-3 py-1.5 text-xs text-theme-text outline-none focus:border-theme-icon/50"
            onKeyDown={e => { if (e.key === 'Enter') createBranch(); if (e.key === 'Escape') setShowBranchForm(false); }} />
          <button onClick={createBranch} className="px-3 py-1.5 text-xs font-medium bg-theme-icon text-white rounded-lg hover:bg-theme-icon/90">Create</button>
          <button onClick={() => setShowBranchForm(false)} className="px-3 py-1.5 text-xs text-theme-text/50 hover:text-theme-text">Cancel</button>
        </div>
      )}

      {/* Stash form */}
      {showStashForm && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-theme-surface border border-theme-border/20 rounded-xl">
          <input value={stashMessage} onChange={e => setStashMessage(e.target.value)}
            placeholder="Stash message (optional)" autoFocus
            className="flex-1 bg-theme-background border border-theme-border/30 rounded-lg px-3 py-1.5 text-xs text-theme-text outline-none focus:border-theme-icon/50"
            onKeyDown={e => { if (e.key === 'Enter') stash(); if (e.key === 'Escape') setShowStashForm(false); }} />
          <button onClick={stash} className="px-3 py-1.5 text-xs font-medium bg-yellow-500 text-black rounded-lg hover:bg-yellow-400">Stash</button>
          <button onClick={() => setShowStashForm(false)} className="px-3 py-1.5 text-xs text-theme-text/50 hover:text-theme-text">Cancel</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Branches + Stashes + History sidebar */}
        <div className="bg-theme-surface border border-theme-border/10 rounded-xl p-3">
          <h3 className="text-xs font-semibold text-theme-text/50 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <FaCodeBranch className="w-3 h-3" /> Branches
          </h3>
          <div className="space-y-1">
            {status.branches.map(b => (
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

          {status.stashes.length > 0 && (
            <>
              <h3 className="text-xs font-semibold text-theme-text/50 uppercase tracking-wider mt-5 mb-3 flex items-center gap-1.5">
                <FaBox className="w-3 h-3" /> Stashes
              </h3>
              <div className="space-y-1">
                {status.stashes.map(s => (
                  <div key={s.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs group">
                    <span className="flex-1 truncate text-theme-text/60">{s.message}</span>
                    <button onClick={() => stashPop(s.id)} className="opacity-0 group-hover:opacity-100 p-0.5 text-green-400 hover:text-green-300" title="Apply"><FaCheckDouble className="w-2.5 h-2.5" /></button>
                    <button onClick={() => stashDrop(s.id)} className="opacity-0 group-hover:opacity-100 p-0.5 text-red-400 hover:text-red-300" title="Drop"><FaTrash className="w-2.5 h-2.5" /></button>
                  </div>
                ))}
              </div>
            </>
          )}

          <h3 className="text-xs font-semibold text-theme-text/50 uppercase tracking-wider mt-5 mb-3 flex items-center gap-1.5">
            <FaHistory className="w-3 h-3" /> History
          </h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {status.commits.map((c, i) => (
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

        {/* Changes panel */}
        <div className="lg:col-span-2 bg-theme-surface border border-theme-border/10 rounded-xl p-3 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-theme-text/50 uppercase tracking-wider">
              Changes ({stagedCount} staged, {modifiedCount} modified, {untrackedCount} untracked{conflictCount > 0 ? `, ${conflictCount} conflicts` : ''})
            </h3>
            <button onClick={stageAll} className="flex items-center gap-1 px-2 py-1 text-[10px] text-theme-text/50 hover:text-theme-text bg-theme-surface/50 rounded-lg transition-colors">
              <FaPlus className="w-2.5 h-2.5" /> Stage All
            </button>
          </div>

          {/* Conflict progress */}
          {conflictCount > 0 && (
            <div className="mb-3">
              <ProgressBar value={0} max={conflictCount} label="Conflicts resolved" color="red" />
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-0.5 max-h-64">
            {status.files.map(file => (
              <div key={file.path} onClick={() => viewDiff(file)}
                className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                  selectedFile === file.path ? 'bg-theme-surface/50' : 'hover:bg-theme-surface/30'
                }`}>
                {file.status === 'conflict' ? (
                  <span className="p-0.5 text-red-500"><FaExclamationTriangle className="w-3 h-3" /></span>
                ) : file.staged ? (
                  <button onClick={e => { e.stopPropagation(); unstageFile(file); }} className="p-0.5 text-green-500 hover:text-green-400" title="Unstage">
                    <FaCheck className="w-3 h-3" />
                  </button>
                ) : (
                  <button onClick={e => { e.stopPropagation(); stageFile(file); }} className="p-0.5 text-theme-text/30 hover:text-theme-text/60" title="Stage">
                    <FaPlus className="w-3 h-3" />
                  </button>
                )}
                <span className={`px-1 py-0.5 rounded text-[10px] font-mono ${
                  file.status === 'conflict' ? 'bg-red-500/20 text-red-400' :
                  file.staged ? 'bg-green-500/20 text-green-400' :
                  file.status === 'untracked' ? 'bg-blue-500/20 text-blue-400' :
                  file.status === 'deleted' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {file.status === 'conflict' ? 'CONFLICT' : file.staged ? 'STAGED' : file.status.toUpperCase()}
                </span>
                <span className={`truncate ${file.status === 'deleted' ? 'text-theme-text/30 line-through' : 'text-theme-text/80'}`}>{file.path}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-theme-border/10 space-y-2">
            <textarea value={commitMessage} onChange={e => setCommitMessage(e.target.value)}
              placeholder="Commit message..." rows={2}
              className="w-full px-3 py-2 bg-theme-background border border-theme-border/20 rounded-xl text-sm text-theme-text placeholder-theme-text/30 focus:outline-none focus:border-theme-icon/40 resize-none" />
            <button onClick={handleCommit} disabled={committing || stagedCount === 0 || conflictCount > 0}
              className="w-full py-2 text-xs font-medium bg-green-600/20 text-green-500 border border-green-600/30 rounded-xl hover:bg-green-600/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={conflictCount > 0 ? 'Resolve conflicts before committing' : undefined}>
              {committing ? 'Committing...' : conflictCount > 0 ? 'Resolve conflicts first' : `Commit (${stagedCount} files)`}
            </button>
          </div>
        </div>

        {/* Diff viewer */}
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
    </TabErrorBoundary>
  );
}
