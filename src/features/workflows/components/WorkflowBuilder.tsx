import React, { useState, useCallback } from 'react';
import { FaPlus, FaTimes, FaArrowUp, FaArrowDown, FaSave, FaArrowLeft, FaCode, FaGlobe, FaTerminal, FaBell, FaFolder, FaCopy, FaFile, FaCompress, FaLock, FaClock, FaTrash } from 'react-icons/fa';
import type { Workflow, WorkflowStep, ActionType, StepConfig } from '../types';
import { ACTION_TYPE_LABELS } from '../types';

interface Props {
  workflow?: Workflow | null;
  onSave: (data: { name: string; description: string; steps: string; category: string }) => Promise<void>;
  onCancel: () => void;
}

const ACTION_TYPES: ActionType[] = [
  'open-folder', 'open-file', 'open-url', 'open-vscode', 'open-terminal', 'open-application',
  'run-command', 'run-script', 'wait', 'notification',
  'copy-file', 'move-file', 'delete-file', 'compress-zip', 'extract-zip',
];

const defaultConfig: Record<ActionType, StepConfig> = {
  'open-folder': { path: '' },
  'open-file': { filePath: '' },
  'open-url': { url: '' },
  'open-vscode': { path: '.' },
  'open-terminal': { path: '.' },
  'open-application': { appPath: '', appArgs: '' },
  'run-command': { command: '', commandCwd: '', waitForCompletion: true },
  'run-script': { scriptPath: '' },
  'wait': { waitDuration: 5, waitUnit: 'seconds' },
  'notification': { notifTitle: '', notifMessage: '', notifType: 'info' },
  'copy-file': { sourcePath: '', destPath: '' },
  'move-file': { sourcePath: '', destPath: '' },
  'delete-file': { filePath: '' },
  'compress-zip': { sourcePath: '', archivePath: '' },
  'extract-zip': { archivePath: '', extractDest: '' },
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

let stepCounter = 0;
function newStep(actionType: ActionType = 'notification'): WorkflowStep {
  stepCounter++;
  return { id: `step_${stepCounter}_${Date.now()}`, actionType, label: ACTION_TYPE_LABELS[actionType], config: { ...defaultConfig[actionType] } };
}

const CAT_OPTS = ['development', 'git', 'files', 'system', 'project', 'custom'];

function ConfigForm({ step, onChange }: { step: WorkflowStep; onChange: (field: string, value: any) => void }) {
  const c = step.config;
  const set = (f: string, v: any) => onChange(f, v);
  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text placeholder:text-theme-text/30 outline-none focus:border-theme-icon/50 transition-colors";
  const sc = "bg-theme-surface border border-theme-border/20 rounded-lg px-2 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50";

  switch (step.actionType) {
    case 'open-folder': case 'open-file': case 'open-vscode': case 'open-terminal':
      return <input type="text" value={c.path || '.'} onChange={e => set('path', e.target.value)} placeholder="Path" className={ic} />;
    case 'open-url': return <input type="text" value={c.url || ''} onChange={e => set('url', e.target.value)} placeholder="https://" className={ic} />;
    case 'open-application': return (
      <div className="space-y-2">
        <input type="text" value={c.appPath || ''} onChange={e => set('appPath', e.target.value)} placeholder="e.g. code, chrome" className={ic} />
        <input type="text" value={c.appArgs || ''} onChange={e => set('appArgs', e.target.value)} placeholder="Arguments (optional)" className={ic} />
      </div>
    );
    case 'run-command': return (
      <div className="space-y-2">
        <input type="text" value={c.command || ''} onChange={e => set('command', e.target.value)} placeholder="e.g. npm run dev" className={`${ic} font-mono`} />
        <input type="text" value={c.commandCwd || ''} onChange={e => set('commandCwd', e.target.value)} placeholder="Working directory (optional)" className={ic} />
      </div>
    );
    case 'run-script': return <input type="text" value={c.scriptPath || ''} onChange={e => set('scriptPath', e.target.value)} placeholder="Script path" className={ic} />;
    case 'wait': return (
      <div className="flex items-center gap-2">
        <input type="number" min={1} value={c.waitDuration || 5} onChange={e => set('waitDuration', parseInt(e.target.value) || 1)} className="w-20 bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50" />
        <select value={c.waitUnit || 'seconds'} onChange={e => set('waitUnit', e.target.value)} className={sc}><option value="seconds">seconds</option><option value="minutes">minutes</option></select>
      </div>
    );
    case 'notification': return (
      <div className="space-y-2">
        <input type="text" value={c.notifTitle || ''} onChange={e => set('notifTitle', e.target.value)} placeholder="Title" className={ic} />
        <input type="text" value={c.notifMessage || ''} onChange={e => set('notifMessage', e.target.value)} placeholder="Message (optional)" className={ic} />
        <select value={c.notifType || 'info'} onChange={e => set('notifType', e.target.value)} className={sc}><option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option><option value="error">Error</option></select>
      </div>
    );
    case 'copy-file': case 'move-file': return (
      <div className="space-y-2">
        <input type="text" value={c.sourcePath || ''} onChange={e => set('sourcePath', e.target.value)} placeholder="Source path" className={ic} />
        <input type="text" value={c.destPath || ''} onChange={e => set('destPath', e.target.value)} placeholder="Destination path" className={ic} />
      </div>
    );
    case 'delete-file': return <input type="text" value={c.filePath || ''} onChange={e => set('filePath', e.target.value)} placeholder="File path" className={ic} />;
    case 'compress-zip': return (
      <div className="space-y-2">
        <input type="text" value={c.sourcePath || c.path || ''} onChange={e => set('sourcePath', e.target.value)} placeholder="Source folder" className={ic} />
        <input type="text" value={c.archivePath || ''} onChange={e => set('archivePath', e.target.value)} placeholder="Output archive" className={ic} />
      </div>
    );
    case 'extract-zip': return (
      <div className="space-y-2">
        <input type="text" value={c.archivePath || c.filePath || ''} onChange={e => set('archivePath', e.target.value)} placeholder="Archive path" className={ic} />
        <input type="text" value={c.extractDest || '.'} onChange={e => set('extractDest', e.target.value)} placeholder="Extract destination" className={ic} />
      </div>
    );
  }
}

export function WorkflowBuilder({ workflow, onSave, onCancel }: Props) {
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [category, setCategory] = useState(workflow?.category || 'custom');
  const [steps, setSteps] = useState<WorkflowStep[]>(workflow?.steps?.length ? workflow.steps : [newStep()]);
  const [saving, setSaving] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const addStep = useCallback((afterIdx?: number) => {
    const s = newStep();
    setSteps(prev => { const c = [...prev]; c.splice(afterIdx !== undefined ? afterIdx + 1 : c.length, 0, s); return c; });
    setSelectedIdx(afterIdx !== undefined ? afterIdx + 1 : steps.length);
  }, [steps.length]);

  const removeStep = useCallback((idx: number) => setSteps(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev), []);
  const moveStep = useCallback((idx: number, dir: -1 | 1) => setSteps(prev => {
    const c = [...prev]; const t = idx + dir;
    if (t < 0 || t >= c.length) return c;
    [c[idx], c[t]] = [c[t], c[idx]];
    return c;
  }), []);

  const updateStep = useCallback((idx: number, field: string, value: any) => {
    setSteps(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      if (field === 'actionType') {
        const at = value as ActionType;
        return { ...s, actionType: at, label: ACTION_TYPE_LABELS[at], config: { ...defaultConfig[at] } };
      }
      if (field === 'label') return { ...s, label: value };
      return { ...s, config: { ...s.config, [field]: value } };
    }));
  }, []);

  const save = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), description: description.trim(), steps: JSON.stringify(steps), category });
    setSaving(false);
  }, [name, description, steps, category, onSave]);

  const sel = steps[selectedIdx] || steps[0];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b border-theme-border/10 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-theme-border/10 transition-colors"><FaArrowLeft className="w-4 h-4 text-theme-text/50" /></button>
          <h2 className="text-base font-semibold text-theme-text">{workflow ? 'Edit Workflow' : 'New Workflow'}</h2>
        </div>
        <button onClick={save} disabled={!name.trim() || saving}
          className="flex items-center gap-2 px-5 py-2 bg-theme-icon text-white text-sm font-medium rounded-xl hover:bg-theme-icon/90 transition-colors disabled:opacity-50"
        ><FaSave className="w-3.5 h-3.5" />{saving ? 'Saving...' : 'Save'}</button>
      </div>

      <div className="flex-1 flex gap-0 overflow-hidden">
        <div className="w-72 shrink-0 border-r border-theme-border/10 overflow-y-auto p-4 space-y-3">
          <div className="space-y-2">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Workflow name" className="w-full bg-theme-surface border border-theme-border/20 rounded-xl px-3 py-2 text-sm text-theme-text placeholder:text-theme-text/30 outline-none focus:border-theme-icon/50" />
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="What does this do?" className="w-full bg-theme-surface border border-theme-border/20 rounded-xl px-3 py-2 text-sm text-theme-text placeholder:text-theme-text/30 outline-none focus:border-theme-icon/50 resize-none" />
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-theme-surface border border-theme-border/20 rounded-xl px-3 py-2 text-sm text-theme-text outline-none focus:border-theme-icon/50">
              {CAT_OPTS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-theme-text/40 uppercase tracking-wider">Steps ({steps.length})</span>
              <button onClick={() => addStep()} className="text-[11px] text-theme-icon hover:underline">+ Add</button>
            </div>
            <div className="space-y-1">
              {steps.map((step, idx) => {
                const Icon = actionIcons[step.actionType] || FaTerminal;
                const color = actionColors[step.actionType] || 'text-theme-text/40';
                return (
                  <div key={step.id} onClick={() => setSelectedIdx(idx)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${selectedIdx === idx ? 'bg-theme-icon/10 border border-theme-icon/20' : 'bg-theme-background border border-theme-border/10 hover:border-theme-border/20'}`}
                  >
                    <span className="text-[10px] text-theme-text/20 font-mono w-4 text-right">{idx + 1}</span>
                    <div className={`w-6 h-6 rounded flex items-center justify-center ${color} bg-theme-icon/5`}><Icon className="w-3 h-3" /></div>
                    <span className="flex-1 text-[11px] text-theme-text truncate">{step.label}</span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                      <button onClick={(e) => { e.stopPropagation(); moveStep(idx, -1); }} disabled={idx === 0} className="p-0.5 text-theme-text/20 hover:text-theme-text/40 disabled:opacity-10"><FaArrowUp className="w-2.5 h-2.5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); moveStep(idx, 1); }} disabled={idx === steps.length - 1} className="p-0.5 text-theme-text/20 hover:text-theme-text/40 disabled:opacity-10"><FaArrowDown className="w-2.5 h-2.5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); removeStep(idx); }} disabled={steps.length <= 1} className="p-0.5 text-theme-text/20 hover:text-red-400 disabled:opacity-10"><FaTimes className="w-2.5 h-2.5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={() => addStep(steps.length - 1)} className="w-full py-2 border-2 border-dashed border-theme-border/20 rounded-lg text-xs text-theme-text/30 hover:text-theme-text/50 hover:border-theme-border/40 transition-colors flex items-center justify-center gap-1">
            <FaPlus className="w-2.5 h-2.5" /> Add Step
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {sel && (
            <div className="space-y-4 max-w-xl">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${actionColors[sel.actionType] || 'text-theme-text/40'} bg-theme-icon/5`}>
                  {React.createElement(actionIcons[sel.actionType] || FaTerminal, { className: 'w-5 h-5' })}
                </div>
                <div className="flex-1">
                  <input type="text" value={sel.label} onChange={e => updateStep(selectedIdx, 'label', e.target.value)} placeholder="Step label" className="w-full bg-transparent text-sm font-medium text-theme-text outline-none placeholder:text-theme-text/30" />
                  <p className="text-[11px] text-theme-text/30">{ACTION_TYPE_LABELS[sel.actionType]} — step {selectedIdx + 1} of {steps.length}</p>
                </div>
                <select value={sel.actionType} onChange={e => updateStep(selectedIdx, 'actionType', e.target.value)} className="bg-theme-surface border border-theme-border/20 rounded-lg px-2 py-1.5 text-xs text-theme-text outline-none focus:border-theme-icon/50">
                  {ACTION_TYPES.map(at => <option key={at} value={at}>{ACTION_TYPE_LABELS[at]}</option>)}
                </select>
              </div>

              <div className="bg-theme-background border border-theme-border/10 rounded-xl p-4">
                <p className="text-[11px] text-theme-text/40 uppercase tracking-wider mb-3">Configuration</p>
                <ConfigForm step={sel} onChange={(f, v) => updateStep(selectedIdx, f, v)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
