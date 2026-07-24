import {
  FaArrowLeft, FaPlay, FaEdit, FaTrash, FaStar, FaRegStar, FaClock,
  FaCheckCircle, FaExclamationCircle, FaSpinner,
} from 'react-icons/fa';
import { Portal } from '../../../components/ui/overlays/Portal';
import { useWorkflowLogs } from '../useWorkflows';
import type { Workflow } from '../types';
import { CATEGORY_LABELS } from '../types';
import { ACTION_META } from '../actionCatalog';

interface Props {
  workflow: Workflow;
  onClose: () => void;
  onRun: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  running?: boolean;
}

const sc: Record<string, { icon: any; color: string; label: string }> = {
  completed: { icon: FaCheckCircle, color: 'text-emerald-400', label: 'Completed' },
  failed: { icon: FaExclamationCircle, color: 'text-red-400', label: 'Failed' },
  running: { icon: FaSpinner, color: 'text-sky-400 animate-spin', label: 'Running' },
};

export function WorkflowDetail({
  workflow, onClose, onRun, onEdit, onDelete, onToggleFavorite, running,
}: Props) {
  const { logs, loading } = useWorkflowLogs(workflow.id);
  const ls = workflow.last_run_status ? sc[workflow.last_run_status] : null;
  const steps = workflow.steps || [];

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div
          className="w-full max-w-2xl bg-theme-surface border border-theme-border rounded-2xl shadow-2xl max-h-[85vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-theme-border/30 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-theme-border/10 shrink-0">
                <FaArrowLeft className="w-4 h-4 text-theme-text/50" />
              </button>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-theme-text truncate">{workflow.name}</h3>
                <p className="text-[11px] text-theme-text/40 truncate">{workflow.description || 'No description'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={onToggleFavorite} className="p-1.5 rounded-lg hover:bg-theme-border/10">
                {workflow.favorite ? <FaStar className="w-3.5 h-3.5 text-amber-400" /> : <FaRegStar className="w-3.5 h-3.5 text-theme-text/30" />}
              </button>
              <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-theme-border/10"><FaEdit className="w-3.5 h-3.5 text-theme-text/40" /></button>
              <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10"><FaTrash className="w-3.5 h-3.5 text-red-400/60" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="flex items-center gap-4 text-xs text-theme-text/40 flex-wrap">
              <span>{CATEGORY_LABELS[workflow.category] || workflow.category}</span>
              <span className="inline-flex items-center gap-1"><FaClock className="w-3 h-3" />{steps.length} steps</span>
              {ls && <span className={`inline-flex items-center gap-1 ${ls.color}`}><ls.icon className="w-3 h-3" />{ls.label}</span>}
              {workflow.last_run_at && <span>Last: {new Date(workflow.last_run_at).toLocaleString()}</span>}
            </div>

            <div>
              <h4 className="text-[10px] font-medium text-theme-text/40 uppercase tracking-wider mb-2">Steps</h4>
              <div className="space-y-1.5">
                {steps.map((step, i) => {
                  const meta = ACTION_META[step.actionType];
                  const Icon = meta?.icon;
                  return (
                    <div key={step.id || i} className="flex items-center gap-3 p-2.5 rounded-xl bg-theme-background border border-theme-border/10">
                      <span className="text-[10px] text-theme-text/20 font-mono w-5 text-right">{i + 1}</span>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${meta?.color || ''} bg-theme-icon/5`}>
                        {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-theme-text truncate">{step.label}</p>
                        <p className="text-[10px] text-theme-text/30 font-mono truncate">{meta?.preview(step.config)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-medium text-theme-text/40 uppercase tracking-wider mb-2">Recent runs</h4>
              {loading ? (
                <div className="flex justify-center py-4"><FaSpinner className="w-4 h-4 text-theme-icon animate-spin" /></div>
              ) : logs.length === 0 ? (
                <p className="text-xs text-theme-text/30 text-center py-4">No runs yet — hit Run below</p>
              ) : (
                <div className="space-y-1.5">
                  {logs.slice(0, 8).map(log => {
                    const s = sc[log.status] || sc.running;
                    return (
                      <div key={log.id} className="flex items-center justify-between p-2.5 rounded-xl bg-theme-background border border-theme-border/10">
                        <div className="flex items-center gap-2">
                          <s.icon className={`w-3 h-3 ${s.color}`} />
                          <span className="text-xs text-theme-text">{s.label}</span>
                        </div>
                        <span className="text-[10px] text-theme-text/30">{new Date(log.started_at).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="px-5 py-3 border-t border-theme-border/30 flex justify-end">
            <button
              onClick={onRun}
              disabled={running}
              className="inline-flex items-center gap-2 px-5 py-2 bg-theme-icon text-white text-sm font-medium rounded-xl hover:bg-theme-icon/90 disabled:opacity-50"
            >
              {running ? <FaSpinner className="w-3.5 h-3.5 animate-spin" /> : <FaPlay className="w-3.5 h-3.5" />}
              {running ? 'Running…' : 'Run workflow'}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
