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
}

export function WorkflowGrid({ workflows, onRun, onEdit, onDelete, onToggleFavorite, onShowDetail, runningId }: GridProps) {
  const { user, examples } = useMemo(() => {
    const u: Workflow[] = [];
    const e: Workflow[] = [];
    for (const w of workflows) {
      if (w.tags?.includes('built-in')) e.push(w);
      else u.push(w);
    }
    return { user: u, examples: e };
  }, [workflows]);

  if (workflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-theme-text/30">
        <p className="text-sm">No workflows found</p>
      </div>
    );
  }

  const renderGrid = (list: Workflow[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      {user.length > 0 && (
        <section>
          <h3 className="text-xs font-medium text-theme-text/40 uppercase tracking-wider mb-3 flex items-center gap-2">
            My Workflows <span className="text-theme-text/20 font-normal normal-case">({user.length})</span>
          </h3>
          {renderGrid(user)}
        </section>
      )}
      {examples.length > 0 && (
        <section>
          <h3 className="text-xs font-medium text-theme-text/30 uppercase tracking-wider mb-3 flex items-center gap-2">
            Examples <span className="text-theme-text/20 font-normal normal-case">({examples.length})</span>
          </h3>
          {renderGrid(examples)}
        </section>
      )}
    </div>
  );
}
