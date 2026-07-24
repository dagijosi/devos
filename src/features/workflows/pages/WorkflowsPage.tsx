import { useState, useMemo, useCallback } from 'react';
import { FaPlay, FaDesktop } from 'react-icons/fa';
import { useWorkflows, useWorkflowRunner } from '../useWorkflows';
import { WorkflowsSidebar } from '../components/WorkflowsSidebar';
import { WorkflowGrid } from '../components/WorkflowGrid';
import { WorkflowBuilder } from '../components/WorkflowBuilder';
import { WorkflowRunner } from '../components/WorkflowRunner';
import { WorkflowDetail } from '../components/WorkflowDetail';
import type { Workflow } from '../types';

type ViewState = { type: 'list' } | { type: 'builder'; workflow?: Workflow } | { type: 'runner'; workflow: Workflow } | { type: 'detail'; workflow: Workflow };

export function WorkflowsPage() {
  const { workflows, loading, createWorkflow, updateWorkflow, deleteWorkflow, toggleFavorite, refresh } = useWorkflows();
  const { running, currentLog, runWorkflow } = useWorkflowRunner();
  const [view, setView] = useState<ViewState>({ type: 'list' });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showRecentOnly, setShowRecentOnly] = useState(false);

  const visibleWorkflows = useMemo(() => {
    let list = [...workflows];
    if (showFavoritesOnly) list = list.filter(w => w.favorite);
    if (activeCategory) list = list.filter(w => w.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(w => w.name.toLowerCase().includes(q) || w.description.toLowerCase().includes(q));
    }
    if (showRecentOnly) {
      list.sort((a, b) => {
        if (!a.last_run_at) return 1;
        if (!b.last_run_at) return -1;
        return new Date(b.last_run_at).getTime() - new Date(a.last_run_at).getTime();
      });
      list = list.slice(0, 10);
    }
    return list;
  }, [workflows, searchQuery, activeCategory, showFavoritesOnly, showRecentOnly]);

  const handleRun = useCallback(async (workflow: Workflow) => {
    setView({ type: 'runner', workflow });
    await runWorkflow(workflow);
  }, [runWorkflow]);

  const handleSave = useCallback(async (data: { name: string; description: string; steps: string; category: string }) => {
    if (view.type === 'builder' && view.workflow) {
      await updateWorkflow(view.workflow.id, data);
    } else {
      await createWorkflow(data);
    }
    setView({ type: 'list' });
  }, [view, createWorkflow, updateWorkflow]);

  const isRunning = view.type === 'runner';

  if (view.type === 'builder') {
    return <WorkflowBuilder workflow={view.workflow ?? null} onSave={handleSave} onCancel={() => setView({ type: 'list' })} />;
  }

  return (
    <div className="p-6 flex gap-6 h-full">
      <WorkflowsSidebar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavorites={() => { setShowFavoritesOnly(!showFavoritesOnly); setShowRecentOnly(false); }}
        showRecentOnly={showRecentOnly}
        onToggleRecent={() => { setShowRecentOnly(!showRecentOnly); setShowFavoritesOnly(false); }}
        onNewWorkflow={() => setView({ type: 'builder' })}
      />

      <div className="flex-1 min-w-0 space-y-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-theme-text tracking-tight">Workflows</h1>
            <p className="text-xs text-theme-text/45 mt-1 max-w-xl">
              One-click actions for your machine — Task Manager, git, editor, and more. Edit examples or create your own.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-theme-text/35">
            <FaDesktop className="w-3 h-3" />
            <span>System commands need the DevOS desktop app</span>
          </div>
        </div>

        {!loading && visibleWorkflows.length > 0 && !searchQuery && !activeCategory && !showFavoritesOnly && !showRecentOnly && (
          <div className="rounded-xl border border-theme-border/15 bg-theme-surface/60 px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-[10px] uppercase tracking-wider text-theme-text/30 font-medium">Try</span>
            {['Open Task Manager', 'Git Status', 'Flush DNS Cache'].map((name) => {
              const wf = workflows.find(w => w.name === name);
              if (!wf) return null;
              return (
                <button
                  key={name}
                  onClick={() => handleRun(wf)}
                  disabled={running}
                  className="inline-flex items-center gap-1.5 text-xs text-theme-icon hover:text-theme-text transition-colors disabled:opacity-40"
                >
                  <FaPlay className="w-2.5 h-2.5" />
                  {name}
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-theme-surface border border-theme-border/20 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-theme-border/20 rounded w-2/3 mb-3" />
                <div className="h-3 bg-theme-border/20 rounded w-full mb-2" />
                <div className="h-3 bg-theme-border/20 rounded w-1/2 mb-4" />
                <div className="h-9 bg-theme-border/20 rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <WorkflowGrid
            workflows={visibleWorkflows}
            onRun={handleRun}
            onEdit={(wf) => setView({ type: 'builder', workflow: wf })}
            onDelete={deleteWorkflow}
            onToggleFavorite={toggleFavorite}
            onShowDetail={(wf) => setView({ type: 'detail', workflow: wf })}
            runningId={isRunning ? (view as any).workflow?.id : null}
          />
        )}
      </div>

      {isRunning && (
        <WorkflowRunner
          workflow={view.workflow}
          log={currentLog}
          running={running}
          onClose={() => { setView({ type: 'list' }); refresh(); }}
        />
      )}
      {view.type === 'detail' && (
        <WorkflowDetail
          workflow={view.workflow}
          onClose={() => setView({ type: 'list' })}
          onRun={() => handleRun(view.workflow)}
          onEdit={() => setView({ type: 'builder', workflow: view.workflow })}
          onDelete={async () => { await deleteWorkflow(view.workflow.id); setView({ type: 'list' }); }}
          onToggleFavorite={() => toggleFavorite(view.workflow.id)}
          running={running}
        />
      )}
    </div>
  );
}
