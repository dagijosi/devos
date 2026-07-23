import { FaTimes, FaSpinner, FaCheckCircle, FaExclamationCircle, FaClock } from 'react-icons/fa';
import type { WorkflowLog, Workflow } from '../types';
import { ACTION_TYPE_LABELS } from '../types';

interface WorkflowRunnerProps {
  workflow: Workflow;
  log: WorkflowLog | null;
  running: boolean;
  onClose: () => void;
}

const stepStatus = {
  pending: { icon: FaClock, color: 'text-theme-text/30', bg: 'bg-theme-text/5' },
  running: { icon: FaSpinner, color: 'text-blue-400 animate-spin', bg: 'bg-blue-500/10' },
  success: { icon: FaCheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
  failed: { icon: FaExclamationCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  skipped: { icon: FaClock, color: 'text-theme-text/30', bg: 'bg-theme-text/5' },
};

export function WorkflowRunner({ workflow, log, running, onClose }: WorkflowRunnerProps) {
  const steps = log?.step_logs || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-theme-surface border border-theme-border rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme-border/30">
          <div>
            <h3 className="text-sm font-semibold text-theme-text">{running ? 'Running...' : log?.status === 'completed' ? 'Completed' : 'Failed'}</h3>
            <p className="text-xs text-theme-text/50 mt-0.5">{workflow.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-theme-border/20 transition-colors">
            <FaTimes className="w-4 h-4 text-theme-text/50" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {steps.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <FaSpinner className="w-5 h-5 text-theme-icon animate-spin" />
            </div>
          )}
          {steps.map((step, i) => {
            const st = stepStatus[step.status] || stepStatus.pending;
            return (
              <div key={step.stepId || i} className={`rounded-xl p-3 border border-theme-border/10 ${st.bg} transition-colors`}>
                <div className="flex items-center gap-2">
                  <st.icon className={`w-3.5 h-3.5 flex-shrink-0 ${st.color}`} />
                  <span className="flex-1 text-xs font-medium text-theme-text truncate">{step.label}</span>
                  <span className="text-[10px] text-theme-text/30">{step.status}</span>
                </div>
                {step.output && step.status !== 'pending' && (
                  <p className="mt-1.5 text-[10px] text-theme-text/50 font-mono pl-6 break-all">{step.output}</p>
                )}
                {step.error && (
                  <p className="mt-1 text-[10px] text-red-400/80 font-mono pl-6 break-all">{step.error}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-theme-border/30 flex justify-between items-center">
          <span className="text-xs text-theme-text/40">
            {steps.filter(s => s.status === 'success').length}/{steps.length} steps succeeded
          </span>
          {!running && (
            <button onClick={onClose} className="px-4 py-1.5 text-xs font-medium bg-theme-icon text-white rounded-lg hover:bg-theme-icon/90 transition-colors">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
