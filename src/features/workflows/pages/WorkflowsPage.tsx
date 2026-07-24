import { useState, useMemo, useCallback, useEffect } from 'react';
import { FaPlay, FaDesktop, FaPlus, FaFolderOpen, FaCodeBranch, FaSave } from 'react-icons/fa';
import { useWorkflows, useWorkflowRunner } from '../useWorkflows';
import { WorkflowsSidebar } from '../components/WorkflowsSidebar';
import { WorkflowGrid } from '../components/WorkflowGrid';
import { WorkflowBuilder } from '../components/WorkflowBuilder';
import { WorkflowRunner } from '../components/WorkflowRunner';
import { WorkflowDetail } from '../components/WorkflowDetail';
import { projectQuickWorkflows } from '../actionCatalog';
import { database } from '../../../database';
import type { Project } from '../../projects/types';
import type { Workflow } from '../types';

type ViewState =
  | { type: 'list' }
  | { type: 'builder'; workflow?: Workflow }
  | { type: 'runner'; workflow: Workflow }
  | { type: 'detail'; workflow: Workflow };

const QUICK = ['Morning coding setup', 'Prepare commit', 'Open Task Manager', 'Ship check'];

function dedupeExamples(list: Workflow[]): Workflow[] {
  const seen = new Set<string>();
  const out: Workflow[] = [];
  for (const w of list) {
    const tags = Array.isArray(w.tags) ? w.tags : [];
    if (tags.includes('built-in')) {
      const key = w.name.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
    }
    out.push(w);
  }
  return out;
}

export function WorkflowsPage() {
  const { workflows, loading, createWorkflow, updateWorkflow, deleteWorkflow, toggleFavorite, refresh } = useWorkflows();
  const { running, currentLog, runWorkflow } = useWorkflowRunner();
  const [view, setView] = useState<ViewState>({ type: 'list' });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showRecentOnly, setShowRecentOnly] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    database.getProjects().then(list => {
      setProjects((list || []).filter((p: Project) => p.status !== 'archived' && p.local_path?.trim()));
    }).catch(() => setProjects([]));
  }, []);

  const visibleWorkflows = useMemo(() => {
    let list = dedupeExamples([...workflows]);
    if (showFavoritesOnly) list = list.filter(w => w.favorite);
    if (activeCategory) list = list.filter(w => w.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(w =>
        w.name.toLowerCase().includes(q) ||
        (w.description || '').toLowerCase().includes(q),
      );
    }
    if (showRecentOnly) {
      list.sort((a, b) => {
        if (!a.last_run_at) return 1;
        if (!b.last_run_at) return -1;
        return new Date(b.last_run_at).getTime() - new Date(a.last_run_at).getTime();
      });
      list = list.slice(0, 12);
    }
    return list;
  }, [workflows, searchQuery, activeCategory, showFavoritesOnly, showRecentOnly]);

  const handleRun = useCallback(async (workflow: Workflow, projectPath?: string) => {
    setView({ type: 'runner', workflow });
    await runWorkflow(workflow, projectPath ? { projectPath } : undefined);
  }, [runWorkflow]);

  const runOpenProject = useCallback(async (project: Project) => {
    const base = workflows.find(w => w.name === 'Open workspace')
      || workflows.find(w => w.name.toLowerCase().includes('open workspace'));
    if (base) {
      await handleRun(base, project.local_path);
      return;
    }
    const def = projectQuickWorkflows(project)[0];
    const created = await createWorkflow({
      name: def.name,
      description: def.description,
      steps: JSON.stringify(def.steps.map((s, i) => ({
        id: `step_${i}_${Date.now()}`,
        ...s,
      }))),
      category: def.category,
      tags: JSON.stringify(['project']),
    });
    if (created) await handleRun(created);
  }, [workflows, handleRun, createWorkflow]);

  const runPullProject = useCallback(async (project: Project) => {
    const base = workflows.find(w => w.name === 'Git pull');
    if (base) {
      await handleRun(base, project.local_path);
      return;
    }
    const def = projectQuickWorkflows(project)[1];
    const created = await createWorkflow({
      name: def.name,
      description: def.description,
      steps: JSON.stringify(def.steps.map((s, i) => ({
        id: `step_${i}_${Date.now()}`,
        ...s,
      }))),
      category: def.category,
      tags: JSON.stringify(['project']),
    });
    if (created) await handleRun(created);
  }, [workflows, handleRun, createWorkflow]);

  const saveProjectWorkflow = useCallback(async (project: Project) => {
    const def = projectQuickWorkflows(project)[0];
    const created = await createWorkflow({
      name: def.name,
      description: def.description,
      steps: JSON.stringify(def.steps.map((s, i) => ({
        id: `step_${i}_${Date.now()}`,
        ...s,
      }))),
      category: def.category,
      tags: JSON.stringify(['project']),
    });
    if (created) {
      await refresh();
      setView({ type: 'builder', workflow: created });
    }
  }, [createWorkflow, refresh]);

  const handleSave = useCallback(async (data: { name: string; description: string; steps: string; category: string }) => {
    if (view.type === 'builder' && view.workflow) {
      await updateWorkflow(view.workflow.id, data);
    } else {
      await createWorkflow(data);
    }
    setView({ type: 'list' });
    await refresh();
  }, [view, createWorkflow, updateWorkflow, refresh]);

  const isRunning = view.type === 'runner';

  if (view.type === 'builder') {
    return (
      <WorkflowBuilder
        workflow={view.workflow ?? null}
        onSave={handleSave}
        onCancel={() => setView({ type: 'list' })}
      />
    );
  }

  return (
    <div className="p-6 flex gap-6 h-full min-h-0">
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

      <div className="flex-1 min-w-0 space-y-5 overflow-y-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-theme-text tracking-tight">Workflows</h1>
            <p className="text-xs text-theme-text/45 mt-1 max-w-lg">
              Connect your projects, then open folders, pull, build, or chain everyday commands in one click.
            </p>
          </div>
          <button
            onClick={() => setView({ type: 'builder' })}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-theme-surface border border-theme-border/20 text-theme-text hover:border-theme-icon/40 transition-colors sm:hidden"
          >
            <FaPlus className="w-3 h-3" /> New
          </button>
        </div>

        {!loading && !searchQuery && !activeCategory && !showFavoritesOnly && !showRecentOnly && projects.length > 0 && (
          <div className="rounded-2xl border border-theme-border/15 bg-theme-surface/70 px-4 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <FaFolderOpen className="w-3.5 h-3.5 text-theme-icon" />
              <span className="text-[10px] uppercase tracking-wider text-theme-text/30 font-medium">From your projects</span>
            </div>
            <div className="space-y-2">
              {projects.slice(0, 6).map(p => (
                <div key={p.id} className="flex flex-wrap items-center gap-2 py-1.5 border-t border-theme-border/10 first:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-theme-text truncate">{p.name}</p>
                    <p className="text-[10px] text-theme-text/35 font-mono truncate">{p.local_path}</p>
                  </div>
                  <button
                    type="button"
                    disabled={running}
                    onClick={() => runOpenProject(p)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-theme-text/70 hover:text-theme-icon hover:bg-theme-icon/10 transition-colors disabled:opacity-40"
                  >
                    <FaPlay className="w-2.5 h-2.5" /> Open
                  </button>
                  <button
                    type="button"
                    disabled={running}
                    onClick={() => runPullProject(p)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-theme-text/70 hover:text-theme-icon hover:bg-theme-icon/10 transition-colors disabled:opacity-40"
                  >
                    <FaCodeBranch className="w-2.5 h-2.5" /> Pull
                  </button>
                  <button
                    type="button"
                    disabled={running}
                    onClick={() => saveProjectWorkflow(p)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-theme-text/70 hover:text-theme-icon hover:bg-theme-icon/10 transition-colors disabled:opacity-40"
                  >
                    <FaSave className="w-2.5 h-2.5" /> Save workflow
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !searchQuery && !activeCategory && !showFavoritesOnly && !showRecentOnly && (
          <div className="rounded-2xl border border-theme-border/15 bg-theme-surface/70 px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
              <span className="text-[10px] uppercase tracking-wider text-theme-text/30 font-medium mr-2">Quick run</span>
              {QUICK.map(name => {
                const wf = workflows.find(w => w.name === name);
                if (!wf) return null;
                return (
                  <button
                    key={name}
                    onClick={() => handleRun(wf)}
                    disabled={running}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-theme-text/70 hover:text-theme-icon hover:bg-theme-icon/10 transition-colors disabled:opacity-40"
                  >
                    <FaPlay className="w-2.5 h-2.5" />
                    {name}
                  </button>
                );
              })}
              <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-theme-text/30">
                <FaDesktop className="w-3 h-3" /> Desktop app for system commands
              </span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="rounded-2xl border border-theme-border/15 bg-theme-surface p-4 animate-pulse h-40" />
            ))}
          </div>
        ) : (
          <WorkflowGrid
            workflows={visibleWorkflows}
            onRun={handleRun}
            onEdit={wf => setView({ type: 'builder', workflow: wf })}
            onDelete={deleteWorkflow}
            onToggleFavorite={toggleFavorite}
            onShowDetail={wf => setView({ type: 'detail', workflow: wf })}
            runningId={isRunning ? view.workflow?.id : null}
            onNew={() => setView({ type: 'builder' })}
          />
        )}
      </div>

      {isRunning && (
        <WorkflowRunner
          workflow={view.workflow}
          log={currentLog}
          running={running}
          onClose={() => { setView({ type: 'list' }); refresh(); }}
          onRunAgain={() => handleRun(view.workflow)}
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
