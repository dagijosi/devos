import { useState, useEffect, useMemo, useCallback } from 'react';
import { FaPlay, FaSpinner, FaCheckCircle, FaExclamationCircle, FaSearch, FaClock, FaRedo, FaTimesCircle, FaCog } from 'react-icons/fa';
import { database } from '../../../../database';
import { actionExecutors } from '../../../workflows/actionRegistry';
import { Portal } from '../../../../components/ui/overlays/Portal';
import { setProjectContext } from '../../utils/projectContext';
import { TabErrorBoundary } from '../../../../components/feedback/TabErrorBoundary';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { ProgressBar } from '../../../../components/ui/ProgressBar';
import { WorkflowTriggerEditor } from '../../../workflows/WorkflowTriggerEditor';
import type { Workflow, WorkflowLog, StepLog } from '../../../workflows/types';

interface Props {
  project: { id: number; name: string; local_path?: string };
}

export function WorkflowsTab({ project }: Props) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [running, setRunning] = useState(false);
  const [runnerLog, setRunnerLog] = useState<WorkflowLog | null>(null);
  const [runningWf, setRunningWf] = useState<Workflow | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTrigger, setEditingTrigger] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    database.getWorkflows().then(setWorkflows).catch(setError).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = workflows;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(w => w.name.toLowerCase().includes(q) || w.description.toLowerCase().includes(q));
    }
    return list;
  }, [workflows, searchQuery]);

  const runWorkflow = useCallback(async (wf: Workflow) => {
    setProjectContext(project);
    setRunning(true);
    setRunningWf(wf);
    setError(null);

    const steps: StepLog[] = wf.steps.map(s => ({
      stepId: s.id, actionType: s.actionType, label: s.label,
      status: 'pending' as const, startedAt: new Date().toISOString(),
      completedAt: null, output: '', error: null,
    }));

    const log = await database.createWorkflowLog(wf.id, 'running', JSON.stringify(steps));
    if (!log) { setRunning(false); setRunningWf(null); return; }
    setRunnerLog(log);

    let allSuccess = true;
    for (let i = 0; i < wf.steps.length; i++) {
      const step = wf.steps[i];
      const sl = steps[i];
      sl.status = 'running';
      sl.startedAt = new Date().toISOString();
      setRunnerLog(prev => prev ? { ...prev, step_logs: [...steps] } : null);

      try {
        const config = { ...step.config };
        if (project.local_path) {
          if (!config.path || config.path === '.' || config.path === '') config.path = project.local_path;
          if (!config.commandCwd || config.commandCwd === '') config.commandCwd = project.local_path;
          if (!config.sourcePath) config.sourcePath = project.local_path;
        }
        const executor = actionExecutors[step.actionType];
        if (!executor) throw new Error(`Unknown action: ${step.actionType}`);
        const result = await executor(config);
        sl.status = result.success ? 'success' : 'failed';
        sl.output = result.output;
        sl.error = result.error || null;
        if (!result.success) allSuccess = false;
      } catch (e: any) {
        sl.status = 'failed';
        sl.error = e.message;
        allSuccess = false;
      }
      sl.completedAt = new Date().toISOString();
      setRunnerLog(prev => prev ? { ...prev, step_logs: [...steps] } : null);
      await database.updateWorkflowLog(log.id, 'running', JSON.stringify([...steps]));
    }

    const status = allSuccess ? 'completed' : 'failed';
    await database.updateWorkflowLog(log.id, status, JSON.stringify(steps));
    await database.updateWorkflowLastRun(wf.id, status);
    setRunnerLog(prev => prev ? { ...prev, status, step_logs: steps, completed_at: new Date().toISOString() } : null);
    setRunning(false);
  }, [project]);

  const retryWorkflow = useCallback((wf: Workflow) => {
    setRunnerLog(null);
    runWorkflow(wf);
  }, [runWorkflow]);

  const st: Record<string, { icon: any; color: string; bg: string }> = {
    pending: { icon: FaClock, color: 'text-theme-text/30', bg: 'bg-theme-text/5' },
    running: { icon: FaSpinner, color: 'text-blue-400 animate-spin', bg: 'bg-blue-500/10' },
    success: { icon: FaCheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
    failed: { icon: FaExclamationCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  };

  if (loading) return <div className="text-center py-8 text-xs text-theme-text/40">Loading workflows...</div>;
  if (error) return <EmptyState icon={<FaExclamationCircle className="w-7 h-7" />} title="Failed to load" description={error.message} cta={{ label: 'Retry', onClick: () => window.location.reload() }} />;

  return (
    <TabErrorBoundary title="Workflows Error">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-theme-text/30" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search workflows..." className="w-full bg-theme-surface border border-theme-border/20 rounded-xl pl-9 pr-3 py-2 text-xs text-theme-text placeholder:text-theme-text/30 outline-none focus:border-theme-icon/50" />
          </div>
          <span className="text-xs text-theme-text/30">{project.name} · {filtered.length} workflows</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<FaPlay className="w-7 h-7" />}
            title={searchQuery ? 'No matching workflows' : 'No workflows available'}
            description={searchQuery ? 'Try a different search term' : 'Create a workflow to automate tasks'}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(wf => (
              <div key={wf.id} className="bg-theme-surface border border-theme-border/20 rounded-xl p-3 hover:border-theme-border/40 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-theme-text truncate">{wf.name}</h4>
                    <p className="text-[10px] text-theme-text/40 mt-0.5 line-clamp-1">{wf.description || 'No description'}</p>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 ${wf.tags?.includes('built-in') ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                    {wf.tags?.includes('built-in') ? 'Example' : 'Custom'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[9px] text-theme-text/30 mb-2">
                  <span>{wf.steps?.length || 0} steps</span>
                  {project.local_path && <span className="truncate max-w-[120px]" title={project.local_path}>{project.local_path}</span>}
                </div>

                {/* Last run indicator */}
                {wf.last_run_status && (
                  <div className={`flex items-center gap-1 mb-2 text-[9px] ${wf.last_run_status === 'completed' ? 'text-green-400/60' : 'text-red-400/60'}`}>
                    {wf.last_run_status === 'completed' ? <FaCheckCircle className="w-2 h-2" /> : <FaExclamationCircle className="w-2 h-2" />}
                    Last: {wf.last_run_status}
                    {wf.last_run_at && ` · ${new Date(wf.last_run_at).toLocaleDateString()}`}
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <button onClick={() => runWorkflow(wf)} disabled={running && runningWf?.id === wf.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium bg-theme-icon/10 text-theme-icon rounded-lg hover:bg-theme-icon/20 transition-colors disabled:opacity-40"
                  >
                    {running && runningWf?.id === wf.id ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaPlay className="w-3 h-3" />}
                    {running && runningWf?.id === wf.id ? 'Running...' : 'Run'}
                  </button>
                  <button onClick={() => setEditingTrigger(editingTrigger === wf.id ? null : wf.id)}
                    className={`p-1.5 rounded-lg transition-colors ${editingTrigger === wf.id ? 'bg-theme-icon/10 text-theme-icon' : 'text-theme-text/30 hover:text-theme-text'}`}
                    title="Configure trigger">
                    <FaCog className="w-3.5 h-3.5" />
                  </button>
                </div>
                {editingTrigger === wf.id && (
                  <div className="mt-3 pt-3 border-t border-theme-border/10">
                    <WorkflowTriggerEditor workflow={wf} onUpdate={() => {}} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Runner modal */}
        {running && runnerLog && runningWf && (
          <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => { setRunning(false); setRunnerLog(null); setRunningWf(null); }}>
              <div className="w-full max-w-md bg-theme-surface border border-theme-border rounded-2xl shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="px-4 py-3 border-b border-theme-border/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-theme-text">{running ? 'Running...' : runnerLog.status === 'completed' ? 'Completed' : 'Failed'}</h3>
                      <p className="text-[11px] text-theme-text/50 mt-0.5">{runningWf.name} — {project.name}</p>
                    </div>
                    {!running && (
                      <div className="flex items-center gap-2">
                        {runnerLog.status === 'failed' && (
                          <button onClick={() => retryWorkflow(runningWf)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors">
                            <FaRedo className="w-2.5 h-2.5" /> Retry
                          </button>
                        )}
                        <button onClick={() => { setRunning(false); setRunnerLog(null); setRunningWf(null); }}
                          className="p-1.5 text-theme-text/30 hover:text-theme-text transition-colors">
                          <FaTimesCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {running && runnerLog.step_logs.length > 0 && (
                  <div className="px-4 pt-3">
                    <ProgressBar
                      value={runnerLog.step_logs.filter(s => s.status === 'success' || s.status === 'failed').length}
                      max={runnerLog.step_logs.length}
                      label="Steps completed"
                      color={runnerLog.status === 'failed' ? 'red' : 'blue'}
                    />
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                  {runnerLog.step_logs.map((step, i) => {
                    const s = st[step.status] || st.pending;
                    return (
                      <div key={step.stepId || i} className={`rounded-lg p-2.5 border border-theme-border/10 ${s.bg}`}>
                        <div className="flex items-center gap-2">
                          <s.icon className={`w-3 h-3 shrink-0 ${s.color}`} />
                          <span className="flex-1 text-[11px] font-medium text-theme-text truncate">{step.label}</span>
                          <span className="text-[9px] text-theme-text/30">{step.status}</span>
                        </div>
                        {step.output && step.status !== 'pending' && <p className="mt-1 text-[9px] text-theme-text/40 font-mono pl-5 break-all">{step.output}</p>}
                        {step.error && <p className="mt-0.5 text-[9px] text-red-400/70 font-mono pl-5 break-all">{step.error}</p>}
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 py-3 border-t border-theme-border/30 flex justify-end">
                  {!running && (
                    <button onClick={() => { setRunning(false); setRunnerLog(null); setRunningWf(null); }}
                      className="px-4 py-1.5 text-xs font-medium bg-theme-icon text-white rounded-lg hover:bg-theme-icon/90 transition-colors">
                      Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Portal>
        )}
      </div>
    </TabErrorBoundary>
  );
}
