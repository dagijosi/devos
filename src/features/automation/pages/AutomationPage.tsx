import { useState, useMemo, useCallback } from 'react';
import { FaPlus, FaSearch, FaTimes } from 'react-icons/fa';
import { useWorkflows, useWorkflowRunner } from '../hooks/useWorkflows';
import { WorkflowCard } from '../components/WorkflowCard';
import { WorkflowBuilder } from '../components/WorkflowBuilder';
import { WorkflowRunner } from '../components/WorkflowRunner';
import { WorkflowHistory } from '../components/WorkflowHistory';
import type { Workflow } from '../types';

type ViewState = { type: 'list' } | { type: 'builder'; workflow?: Workflow } | { type: 'runner'; workflow: Workflow } | { type: 'history'; workflow: Workflow };

export function AutomationPage() {
  const { workflows, loading, createWorkflow, updateWorkflow, deleteWorkflow, toggleFavorite, refresh } = useWorkflows();
  const { running, currentLog, runWorkflow } = useWorkflowRunner();
  const [view, setView] = useState<ViewState>({ type: 'list' });
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return workflows;
    const q = searchQuery.toLowerCase();
    return workflows.filter(w =>
      w.name.toLowerCase().includes(q) ||
      w.description.toLowerCase().includes(q)
    );
  }, [workflows, searchQuery]);

  const morningWorkflows = useMemo(() => filtered.filter(w => w.category === 'morning'), [filtered]);
  const customWorkflows = useMemo(() => filtered.filter(w => w.category !== 'morning'), [filtered]);

  const handleSave = useCallback(async (data: { name: string; description: string; steps: string; category: string }) => {
    if (view.type === 'builder' && view.workflow) {
      await updateWorkflow(view.workflow.id, data);
    } else {
      await createWorkflow(data);
    }
    setView({ type: 'list' });
  }, [view, createWorkflow, updateWorkflow]);

  const handleRun = useCallback(async (workflow: Workflow) => {
    setView({ type: 'runner', workflow });
    await runWorkflow(workflow);
  }, [runWorkflow]);

  if (view.type === 'builder') {
    return (
      <div className="max-w-5xl mx-auto">
        <WorkflowBuilder workflow={view.workflow ?? null} onSave={handleSave} onCancel={() => setView({ type: 'list' })} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-text">Automation</h1>
          <p className="text-sm text-theme-text/60 mt-1">Automate your development workflow</p>
        </div>
        <button
          onClick={() => setView({ type: 'builder' })}
          className="flex items-center gap-2 px-4 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors"
        >
          <FaPlus className="w-3.5 h-3.5" />
          New Workflow
        </button>
      </div>

      <div className="relative">
        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search workflows..."
          className="w-full bg-theme-surface border border-theme-border/30 rounded-xl pl-10 pr-10 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 focus:ring-1 focus:ring-theme-icon/30 transition-all"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text/30 hover:text-theme-text/60">
            <FaTimes className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-theme-border/20 rounded w-2/3 mb-3" />
              <div className="h-3 bg-theme-border/20 rounded w-full mb-2" />
              <div className="h-3 bg-theme-border/20 rounded w-1/2 mb-4" />
              <div className="h-9 bg-theme-border/20 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-12 text-center">
          <FaPlus className="w-10 h-10 text-theme-text/20 mx-auto mb-3" />
          <p className="text-sm text-theme-text/40 mb-4">
            {searchQuery ? 'No workflows match your search' : 'No workflows yet'}
          </p>
          {!searchQuery && (
            <button onClick={() => setView({ type: 'builder' })} className="px-5 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors">
              Create your first workflow
            </button>
          )}
        </div>
      ) : (
        <>
          {morningWorkflows.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-theme-text/50 uppercase tracking-wider mb-3">Morning Routines</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {morningWorkflows.map(wf => (
                  <WorkflowCard
                    key={wf.id}
                    workflow={wf}
                    onRun={() => handleRun(wf)}
                    onEdit={() => setView({ type: 'builder', workflow: wf })}
                    onDelete={async () => { await deleteWorkflow(wf.id); }}
                    onToggleFavorite={() => toggleFavorite(wf.id)}
                    running={view.type === 'runner' && (view as any).workflow?.id === wf.id && running}
                  />
                ))}
              </div>
            </section>
          )}

          {customWorkflows.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-theme-text/50 uppercase tracking-wider mb-3">Custom Workflows</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {customWorkflows.map(wf => (
                  <WorkflowCard
                    key={wf.id}
                    workflow={wf}
                    onRun={() => handleRun(wf)}
                    onEdit={() => setView({ type: 'builder', workflow: wf })}
                    onDelete={async () => { await deleteWorkflow(wf.id); }}
                    onToggleFavorite={() => toggleFavorite(wf.id)}
                    running={view.type === 'runner' && (view as any).workflow?.id === wf.id && running}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {view.type === 'runner' && (
        <WorkflowRunner
          workflow={view.workflow}
          log={currentLog}
          running={running}
          onClose={() => { setView({ type: 'list' }); refresh(); }}
        />
      )}
    </div>
  );
}
