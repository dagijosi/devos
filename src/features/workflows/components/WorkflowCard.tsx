import { FaPlay, FaEdit, FaTrash, FaStar, FaRegStar, FaClock, FaCheckCircle, FaExclamationCircle, FaSpinner, FaCode, FaGlobe, FaTerminal, FaBell, FaFolder, FaCopy, FaFile, FaCompress, FaLock, FaInfoCircle } from 'react-icons/fa';
import type { Workflow } from '../types';

interface Props {
  workflow: Workflow;
  onRun: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onShowDetail: () => void;
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

function estimateDuration(steps: any[]): string {
  let t = 0;
  for (const s of steps || []) {
    if (s.actionType === 'wait') t += (s.config?.waitDuration || 5) * (s.config?.waitUnit === 'minutes' ? 60 : 1);
    else t += 2;
  }
  return t < 60 ? `${t}s` : `${Math.round(t / 60)}m`;
}

export function WorkflowCard({ workflow, onRun, onEdit, onDelete, onToggleFavorite, onShowDetail, running }: Props) {
  const ls = workflow.last_run_status ? sc[workflow.last_run_status] : null;
  const count = workflow.steps?.length || 0;
  const dur = estimateDuration(workflow.steps);

  return (
    <div className="bg-theme-surface border border-theme-border/20 rounded-xl hover:border-theme-border/40 transition-all group">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <button onClick={onToggleFavorite} className="p-0.5 shrink-0">
                {workflow.favorite ? <FaStar className="w-3 h-3 text-amber-400" /> : <FaRegStar className="w-3 h-3 text-theme-text/20 group-hover:text-theme-text/40" />}
              </button>
              <h3 className="text-sm font-semibold text-theme-text truncate">{workflow.name}</h3>
            </div>
            <p className="text-[11px] text-theme-text/40 mt-0.5 line-clamp-1">{workflow.description || 'No description'}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onShowDetail} className="p-1.5 rounded-lg hover:bg-theme-border/10 text-theme-text/30 hover:text-theme-text/60 transition-colors" title="Details"><FaInfoCircle className="w-3 h-3" /></button>
            <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-theme-border/10 text-theme-text/30 hover:text-theme-text/60 transition-colors" title="Edit"><FaEdit className="w-3 h-3" /></button>
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 text-theme-text/30 hover:text-red-400 transition-colors" title="Delete"><FaTrash className="w-3 h-3" /></button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-theme-text/30 mb-3">
          <span className="flex items-center gap-1"><FaClock className="w-2.5 h-2.5" />{count} steps</span>
          <span>~{dur}</span>
          {ls ? (
            <span className={`flex items-center gap-1 ${ls.color}`}><ls.icon className="w-2.5 h-2.5" />{ls.label}</span>
          ) : <span>Never run</span>}
        </div>

        {workflow.steps && workflow.steps.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-3">
            {workflow.steps.slice(0, 5).map((s, i) => {
              const Icon = actionIcons[s.actionType] || FaTerminal;
              return <span key={i} className="p-1 rounded-md bg-theme-background border border-theme-border/10" title={s.label}><Icon className="w-2.5 h-2.5 text-theme-text/40" /></span>;
            })}
            {workflow.steps.length > 5 && <span className="text-[9px] text-theme-text/30 ml-0.5">+{workflow.steps.length - 5}</span>}
          </div>
        )}
      </div>

      <button onClick={onRun} disabled={running}
        className="w-full flex items-center justify-center gap-2 py-2.5 border-t border-theme-border/10 text-sm font-medium text-theme-icon hover:bg-theme-icon/5 transition-colors disabled:opacity-40 rounded-b-xl"
      >
        {running ? <FaSpinner className="w-3.5 h-3.5 animate-spin" /> : <FaPlay className="w-3.5 h-3.5" />}
        {running ? 'Running...' : 'Run'}
      </button>
    </div>
  );
}
