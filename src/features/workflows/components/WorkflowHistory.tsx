import { FaTimes, FaCheckCircle, FaExclamationCircle, FaSpinner, FaClock } from 'react-icons/fa';
import { Portal } from '../../../components/ui/overlays/Portal';
import { useWorkflowLogs } from '../useWorkflows';
import type { Workflow } from '../types';

interface WorkflowHistoryProps {
  workflow: Workflow;
  onClose: () => void;
}

const sc: Record<string, { icon: any; color: string; label: string }> = {
  completed: { icon: FaCheckCircle, color: 'text-green-400', label: 'Completed' },
  failed: { icon: FaExclamationCircle, color: 'text-red-400', label: 'Failed' },
  running: { icon: FaSpinner, color: 'text-blue-400', label: 'Running' },
};

export function WorkflowHistory({ workflow, onClose }: WorkflowHistoryProps) {
  const { logs, loading } = useWorkflowLogs(workflow.id);

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-lg bg-theme-surface border border-theme-border rounded-2xl shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-theme-border/30">
            <div><h3 className="text-sm font-semibold text-theme-text">Run History</h3><p className="text-xs text-theme-text/50 mt-0.5">{workflow.name}</p></div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-theme-border/20 transition-colors"><FaTimes className="w-4 h-4 text-theme-text/50" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? <div className="flex items-center justify-center py-8"><FaSpinner className="w-5 h-5 text-theme-icon animate-spin" /></div> : logs.length === 0 ? (
              <div className="text-center py-8"><FaClock className="w-8 h-8 text-theme-text/20 mx-auto mb-2" /><p className="text-xs text-theme-text/40">No runs yet</p></div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => {
                  const s = sc[log.status] || sc.running;
                  return (
                    <div key={log.id} className="bg-theme-background border border-theme-border/20 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><s.icon className={`w-3.5 h-3.5 ${s.color}`} /><span className="text-xs font-medium text-theme-text">{s.label}</span></div>
                        <span className="text-[10px] text-theme-text/30">{new Date(log.started_at).toLocaleString()}</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        {log.step_logs?.map((sl, i) => (
                          <div key={sl.stepId || i} className="flex items-center gap-2 text-[10px] text-theme-text/40">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sl.status === 'success' ? 'bg-green-400' : sl.status === 'failed' ? 'bg-red-400' : sl.status === 'running' ? 'bg-blue-400' : 'bg-theme-text/20'}`} />
                            <span className="truncate">{sl.label}</span>
                            {sl.error && <span className="text-red-400/70 truncate">— {sl.error}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="px-5 py-3 border-t border-theme-border/30 flex justify-end">
            <button onClick={onClose} className="px-4 py-1.5 text-xs font-medium bg-theme-icon text-white rounded-lg hover:bg-theme-icon/90 transition-colors">Close</button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
