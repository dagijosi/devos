import { FaArrowLeft, FaPlay, FaEdit, FaTrash, FaStar, FaRegStar, FaClock, FaCheckCircle, FaExclamationCircle, FaSpinner, FaCode, FaGlobe, FaTerminal, FaBell, FaFolder, FaCopy, FaFile, FaCompress, FaLock } from 'react-icons/fa';
import { Portal } from '../../../components/ui/overlays/Portal';
import { useWorkflowLogs } from '../useWorkflows';
import type { Workflow } from '../types';
import { CATEGORY_LABELS } from '../types';

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
  completed: { icon: FaCheckCircle, color: 'text-green-400', label: 'Completed' },
  failed: { icon: FaExclamationCircle, color: 'text-red-400', label: 'Failed' },
  running: { icon: FaSpinner, color: 'text-blue-400 animate-spin', label: 'Running' },
};

const actionIcons: Record<string, any> = {
  'open-folder': FaFolder, 'open-file': FaFile, 'open-url': FaGlobe, 'open-vscode': FaCode,
  'open-terminal': FaTerminal, 'open-application': FaCode, 'run-command': FaTerminal,
  'run-script': FaTerminal, 'wait': FaClock, 'notification': FaBell,
  'copy-file': FaCopy, 'move-file': FaCopy, 'delete-file': FaTrash,
  'compress-zip': FaCompress, 'extract-zip': FaLock,
};

const actionColors: Record<string, string> = {
  'open-folder': 'text-blue-400', 'open-file': 'text-blue-400', 'open-url': 'text-sky-400',
  'open-vscode': 'text-purple-400', 'open-terminal': 'text-zinc-400', 'open-application': 'text-cyan-400',
  'run-command': 'text-green-400', 'run-script': 'text-green-400',
  'wait': 'text-yellow-400', 'notification': 'text-pink-400',
  'copy-file': 'text-orange-400', 'move-file': 'text-orange-400', 'delete-file': 'text-red-400',
  'compress-zip': 'text-amber-400', 'extract-zip': 'text-amber-400',
};

export function WorkflowDetail({ workflow, onClose, onRun, onEdit, onDelete, onToggleFavorite, running }: Props) {
  const { logs, loading } = useWorkflowLogs(workflow.id);
  const ls = workflow.last_run_status ? sc[workflow.last_run_status] : null;
  const count = workflow.steps?.length || 0;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-2xl bg-theme-surface border border-theme-border rounded-2xl shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-theme-border/30">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-theme-border/10 transition-colors"><FaArrowLeft className="w-4 h-4 text-theme-text/50" /></button>
              <div>
                <h3 className="text-sm font-semibold text-theme-text">{workflow.name}</h3>
                <p className="text-[11px] text-theme-text/40">{workflow.description || 'No description'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={onToggleFavorite} className="p-1.5 rounded-lg hover:bg-theme-border/10 transition-colors">{workflow.favorite ? <FaStar className="w-3.5 h-3.5 text-amber-400" /> : <FaRegStar className="w-3.5 h-3.5 text-theme-text/30" />}</button>
              <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-theme-border/10 transition-colors"><FaEdit className="w-3.5 h-3.5 text-theme-text/40" /></button>
              <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"><FaTrash className="w-3.5 h-3.5 text-red-400/60" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="flex items-center gap-4 text-xs text-theme-text/40">
              <span>{CATEGORY_LABELS[workflow.category] || workflow.category}</span>
              <span className="flex items-center gap-1"><FaClock className="w-3 h-3" />{count} steps</span>
              {ls && <span className={`flex items-center gap-1 ${ls.color}`}><ls.icon className="w-3 h-3" />{ls.label}</span>}
              {workflow.last_run_at && <span>Last run: {new Date(workflow.last_run_at).toLocaleString()}</span>}
            </div>

            <div>
              <h4 className="text-xs font-medium text-theme-text/50 uppercase tracking-wider mb-2">Steps</h4>
              <div className="space-y-1.5">
                {workflow.steps?.map((step, i) => {
                  const Icon = actionIcons[step.actionType] || FaTerminal;
                  const color = actionColors[step.actionType] || 'text-theme-text/40';
                  return (
                    <div key={step.id || i} className="flex items-center gap-3 p-2.5 rounded-lg bg-theme-background border border-theme-border/10">
                      <span className="text-[10px] text-theme-text/20 font-mono w-5 text-right">{i + 1}</span>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color} bg-theme-icon/5`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-theme-text truncate">{step.label}</p>
                        <p className="text-[10px] text-theme-text/30 font-mono truncate">{step.actionType}</p>
                      </div>
                      <FaChevronRight className="w-3 h-3 text-theme-text/20" />
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-theme-text/50 uppercase tracking-wider mb-2">Run History</h4>
              {loading ? <div className="flex items-center justify-center py-4"><FaSpinner className="w-4 h-4 text-theme-icon animate-spin" /></div> : logs.length === 0 ? (
                <p className="text-xs text-theme-text/30 text-center py-4">No runs yet</p>
              ) : (
                <div className="space-y-1.5">
                  {logs.slice(0, 10).map((log) => {
                    const s = sc[log.status] || sc.running;
                    return (
                      <div key={log.id} className="flex items-center justify-between p-2.5 rounded-lg bg-theme-background border border-theme-border/10">
                        <div className="flex items-center gap-2"><s.icon className={`w-3 h-3 ${s.color}`} /><span className="text-xs text-theme-text">{s.label}</span></div>
                        <span className="text-[10px] text-theme-text/30">{new Date(log.started_at).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="px-5 py-3 border-t border-theme-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-theme-text/40">
              <span>{workflow.steps?.length || 0} steps · ~{workflow.steps?.reduce((t, s) => t + (s.actionType === 'wait' ? (s.config?.waitDuration || 5) : 2), 0) || 0}s</span>
            </div>
            <button onClick={onRun} disabled={running}
              className="flex items-center gap-2 px-5 py-2 bg-theme-icon text-white text-sm font-medium rounded-xl hover:bg-theme-icon/90 transition-colors disabled:opacity-50"
            >
              {running ? <FaSpinner className="w-3.5 h-3.5 animate-spin" /> : <FaPlay className="w-3.5 h-3.5" />}
              {running ? 'Running...' : 'Run Workflow'}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

function FaChevronRight({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>;
}
