import { useMemo } from 'react';
import type { Workflow } from '../types';
import { WorkflowCard } from './WorkflowCard';

interface GridProps {
  workflows: Workflow[];
  onRun: (wf: Workflow) => void;
  onEdit: (wf: Workflow) => void;
  onDelete: (id: number) => void;
  onToggleFavorite: (id: number) => void;
  onShowDetail: (wf: Workflow) => void;
  runningId?: number | null;
  onNew: () => void;
}

export function WorkflowGrid({
  workflows, onRun, onEdit, onDelete, onToggleFavorite, onShowDetail, runningId, onNew,
}: GridProps) {
  const { mine, examples } = useMemo(() => {
    const mine: Workflow[] = [];
    const examples: Workflow[] = [];
    for (const w of workflows) {
      const tags = Array.isArray(w.tags) ? w.tags : [];
      if (tags.includes('built-in')) examples.push(w);
      else mine.push(w);
    }
    return { mine, examples };
  }, [workflows]);

  if (workflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <p className="text-sm font-medium text-theme-text/50">No workflows yet</p>
        <p className="text-xs text-theme-text/30 mt-1 max-w-sm">
          Build a sequence of commands — open your editor, pull git, run builds — then run it in one click.
        </p>
        <button onClick={onNew} className="mt-4 px-4 py-2 rounded-xl text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90">
          Create your first workflow
        </button>
      </div>
    );
  }

  const render = (list: Workflow[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {list.map(wf => (
        <WorkflowCard
          key={wf.id}
          workflow={wf}
          onRun={() => onRun(wf)}
          onEdit={() => onEdit(wf)}
          onDelete={() => onDelete(wf.id)}
          onToggleFavorite={() => onToggleFavorite(wf.id)}
          onShowDetail={() => onShowDetail(wf)}
          running={runningId === wf.id}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      {mine.length > 0 && (
        <section>
          <h3 className="text-[10px] font-medium text-theme-text/40 uppercase tracking-wider mb-3">
            My workflows <span className="text-theme-text/25 normal-case">({mine.length})</span>
          </h3>
          {render(mine)}
        </section>
      )}
      {examples.length > 0 && (
        <section>
          <h3 className="text-[10px] font-medium text-theme-text/40 uppercase tracking-wider mb-3">
            Examples you can run <span className="text-theme-text/25 normal-case">({examples.length})</span>
          </h3>
          {render(examples)}
        </section>
      )}
    </div>
  );
}
