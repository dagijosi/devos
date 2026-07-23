import { FaPlay, FaEdit, FaTrash, FaStar, FaRegStar, FaClock, FaCheckCircle, FaExclamationCircle, FaSpinner } from 'react-icons/fa';
import type { Workflow } from '../types';

interface WorkflowCardProps {
  workflow: Workflow;
  onRun: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  running?: boolean;
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  completed: { icon: FaCheckCircle, color: 'text-green-400', label: 'Completed' },
  failed: { icon: FaExclamationCircle, color: 'text-red-400', label: 'Failed' },
  running: { icon: FaSpinner, color: 'text-blue-400 animate-spin', label: 'Running' },
};

export function WorkflowCard({ workflow, onRun, onEdit, onDelete, onToggleFavorite, running }: WorkflowCardProps) {
  const lastStatus = workflow.last_run_status ? statusConfig[workflow.last_run_status] : null;
  const stepCount = workflow.steps?.length || 0;

  return (
    <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5 hover:border-theme-border/60 transition-all duration-200 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-theme-text truncate">{workflow.name}</h3>
            {workflow.category === 'morning' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gradient-to-r from-orange-500/20 to-pink-500/20 text-orange-400 border border-orange-500/30 font-medium">Morning</span>
            )}
          </div>
          <p className="text-xs text-theme-text/50 mt-1 line-clamp-2">{workflow.description || 'No description'}</p>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-theme-text/40">
            <span className="flex items-center gap-1">
              <FaClock className="w-2.5 h-2.5" />
              {stepCount} step{stepCount !== 1 ? 's' : ''}
            </span>
            {lastStatus ? (
              <span className={`flex items-center gap-1 ${lastStatus.color}`}>
                <lastStatus.icon className="w-2.5 h-2.5" />
                {lastStatus.label}
                {workflow.last_run_at && (
                  <span className="text-theme-text/30 ml-1">
                    {new Date(workflow.last_run_at).toLocaleDateString()}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-theme-text/30">Never run</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onToggleFavorite}
            className="p-2 rounded-lg hover:bg-theme-border/20 transition-colors opacity-0 group-hover:opacity-100"
            title={workflow.favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {workflow.favorite ? <FaStar className="w-3 h-3 text-yellow-400" /> : <FaRegStar className="w-3 h-3 text-theme-text/30" />}
          </button>
          <button
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-theme-border/20 transition-colors opacity-0 group-hover:opacity-100"
            title="Edit"
          >
            <FaEdit className="w-3 h-3 text-theme-text/40" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
            title="Delete"
          >
            <FaTrash className="w-3 h-3 text-red-400/60" />
          </button>
        </div>
      </div>
      <button
        onClick={onRun}
        disabled={running}
        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-theme-icon text-white text-sm font-medium rounded-xl hover:bg-theme-icon/90 transition-colors disabled:opacity-50"
      >
        {running ? (
          <FaSpinner className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FaPlay className="w-3.5 h-3.5" />
        )}
        {running ? 'Running...' : 'Run'}
      </button>
    </div>
  );
}
