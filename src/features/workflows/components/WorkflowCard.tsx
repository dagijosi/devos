import { FaPlay, FaEdit, FaTrash, FaStar, FaRegStar, FaCheckCircle, FaExclamationCircle, FaSpinner } from 'react-icons/fa';
import type { Workflow } from '../types';
import { CATEGORY_LABELS } from '../types';
import { ACTION_META } from '../actionCatalog';

interface Props {
  workflow: Workflow;
  onRun: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onShowDetail: () => void;
  running?: boolean;
}

const statusMeta: Record<string, { icon: any; color: string; label: string }> = {
  completed: { icon: FaCheckCircle, color: 'text-emerald-400', label: 'OK' },
  failed: { icon: FaExclamationCircle, color: 'text-red-400', label: 'Failed' },
  running: { icon: FaSpinner, color: 'text-sky-400 animate-spin', label: 'Running' },
};

export function WorkflowCard({ workflow, onRun, onEdit, onDelete, onToggleFavorite, onShowDetail, running }: Props) {
  const steps = workflow.steps || [];
  const ls = workflow.last_run_status ? statusMeta[workflow.last_run_status] : null;
  const isBuiltIn = Array.isArray(workflow.tags) && workflow.tags.includes('built-in');

  return (
    <article className="group flex flex-col rounded-2xl border border-theme-border/15 bg-theme-surface hover:border-theme-border/35 transition-all overflow-hidden">
      <div className="p-4 flex-1 space-y-3">
        <div className="flex items-start gap-2">
          <button onClick={onToggleFavorite} className="p-0.5 mt-0.5 shrink-0" title="Favorite">
            {workflow.favorite
              ? <FaStar className="w-3.5 h-3.5 text-amber-400" />
              : <FaRegStar className="w-3.5 h-3.5 text-theme-text/20 group-hover:text-theme-text/40" />}
          </button>
          <div className="min-w-0 flex-1 cursor-pointer" onClick={onShowDetail}>
            <h3 className="text-sm font-semibold text-theme-text truncate">{workflow.name}</h3>
            <p className="text-[11px] text-theme-text/40 mt-0.5 line-clamp-2">{workflow.description || 'No description'}</p>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-theme-border/10 text-theme-text/35 hover:text-theme-text" title="Edit"><FaEdit className="w-3 h-3" /></button>
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 text-theme-text/35 hover:text-red-400" title="Delete"><FaTrash className="w-3 h-3" /></button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-[10px] text-theme-text/35">
          <span className="px-1.5 py-0.5 rounded-md bg-theme-background border border-theme-border/10">
            {CATEGORY_LABELS[workflow.category] || workflow.category}
          </span>
          {isBuiltIn && <span className="px-1.5 py-0.5 rounded-md bg-theme-icon/10 text-theme-icon/80">Example</span>}
          <span>{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
          {ls && (
            <span className={`inline-flex items-center gap-1 ${ls.color}`}>
              <ls.icon className="w-2.5 h-2.5" />{ls.label}
            </span>
          )}
        </div>

        {steps.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {steps.slice(0, 6).map((s, i) => {
              const meta = ACTION_META[s.actionType];
              const Icon = meta?.icon;
              return (
                <span key={s.id || i} title={s.label} className={`p-1.5 rounded-lg bg-theme-background border border-theme-border/10 ${meta?.color || 'text-theme-text/40'}`}>
                  {Icon ? <Icon className="w-2.5 h-2.5" /> : null}
                </span>
              );
            })}
            {steps.length > 6 && <span className="text-[9px] text-theme-text/30">+{steps.length - 6}</span>}
          </div>
        )}
      </div>

      <button
        onClick={onRun}
        disabled={running}
        className="w-full flex items-center justify-center gap-2 py-2.5 border-t border-theme-border/10 text-sm font-medium text-theme-icon hover:bg-theme-icon/8 transition-colors disabled:opacity-40"
      >
        {running ? <FaSpinner className="w-3.5 h-3.5 animate-spin" /> : <FaPlay className="w-3.5 h-3.5" />}
        {running ? 'Running…' : 'Run'}
      </button>
    </article>
  );
}
