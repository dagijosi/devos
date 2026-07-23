import { useState, useCallback } from 'react';
import { FaPlus, FaTimes, FaArrowUp, FaArrowDown, FaSave, FaTimes as FaClose } from 'react-icons/fa';
import type { Workflow, WorkflowStep, ActionType, StepConfig } from '../types';
import { ACTION_TYPE_LABELS } from '../types';

interface WorkflowBuilderProps {
  workflow?: Workflow | null;
  onSave: (data: { name: string; description: string; steps: string; category: string }) => Promise<void>;
  onCancel: () => void;
}

const ACTION_TYPES: ActionType[] = ['open-application', 'open-url', 'run-command', 'wait', 'notification', 'condition'];

const defaultConfig: Record<ActionType, StepConfig> = {
  'open-application': { appPath: '', appArgs: '' },
  'open-url': { url: '' },
  'run-command': { command: '', commandCwd: '', waitForCompletion: true },
  'wait': { waitDuration: 5, waitUnit: 'seconds' },
  'notification': { notifTitle: '', notifMessage: '', notifType: 'info' },
  'condition': { conditionVariable: '', conditionOperator: 'equals', conditionValue: '' },
};

let stepCounter = 0;
function newStep(actionType: ActionType = 'notification'): WorkflowStep {
  stepCounter++;
  return { id: `step_${stepCounter}_${Date.now()}`, actionType, label: ACTION_TYPE_LABELS[actionType], config: { ...defaultConfig[actionType] } };
}

export function WorkflowBuilder({ workflow, onSave, onCancel }: WorkflowBuilderProps) {
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [category, setCategory] = useState(workflow?.category || 'custom');
  const [steps, setSteps] = useState<WorkflowStep[]>(workflow?.steps?.length ? workflow.steps : [newStep()]);
  const [saving, setSaving] = useState(false);

  const addStep = useCallback((afterIdx?: number) => {
    const s = newStep();
    setSteps(prev => {
      const copy = [...prev];
      const idx = afterIdx !== undefined ? afterIdx + 1 : copy.length;
      copy.splice(idx, 0, s);
      return copy;
    });
  }, []);

  const removeStep = useCallback((idx: number) => {
    setSteps(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  }, []);

  const moveStep = useCallback((idx: number, dir: -1 | 1) => {
    setSteps(prev => {
      const copy = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= copy.length) return copy;
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy;
    });
  }, []);

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
    await onSave({
      name: name.trim(),
      description: description.trim(),
      steps: JSON.stringify(steps),
      category,
    });
    setSaving(false);
  }, [name, description, steps, category, onSave]);

  const renderConfig = (step: WorkflowStep, idx: number) => {
    const c = step.config;
    const set = (field: string, value: any) => updateStep(idx, field, value);

    switch (step.actionType) {
      case 'open-application':
        return (
          <div className="space-y-2">
            <input type="text" value={c.appPath || ''} onChange={e => set('appPath', e.target.value)} placeholder="e.g. code, chrome, C:/path/to/app.exe" className="w-full bg-theme-background border border-theme-border/20 rounded-lg px-3 py-1.5 text-xs text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
            <input type="text" value={c.appArgs || ''} onChange={e => set('appArgs', e.target.value)} placeholder="Arguments (optional)" className="w-full bg-theme-background border border-theme-border/20 rounded-lg px-3 py-1.5 text-xs text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
          </div>
        );
      case 'open-url':
        return (
          <input type="text" value={c.url || ''} onChange={e => set('url', e.target.value)} placeholder="https://example.com" className="w-full bg-theme-background border border-theme-border/20 rounded-lg px-3 py-1.5 text-xs text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
        );
      case 'run-command':
        return (
          <div className="space-y-2">
            <input type="text" value={c.command || ''} onChange={e => set('command', e.target.value)} placeholder="e.g. npm run dev" className="w-full bg-theme-background border border-theme-border/20 rounded-lg px-3 py-1.5 text-xs text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 font-mono" />
            <input type="text" value={c.commandCwd || ''} onChange={e => set('commandCwd', e.target.value)} placeholder="Working directory (optional)" className="w-full bg-theme-background border border-theme-border/20 rounded-lg px-3 py-1.5 text-xs text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
          </div>
        );
      case 'wait':
        return (
          <div className="flex items-center gap-2">
            <input type="number" min={1} value={c.waitDuration || 5} onChange={e => set('waitDuration', parseInt(e.target.value) || 1)} className="w-20 bg-theme-background border border-theme-border/20 rounded-lg px-3 py-1.5 text-xs text-theme-text outline-none focus:border-theme-icon/50" />
            <select value={c.waitUnit || 'seconds'} onChange={e => set('waitUnit', e.target.value)} className="bg-theme-background border border-theme-border/20 rounded-lg px-2 py-1.5 text-xs text-theme-text outline-none focus:border-theme-icon/50">
              <option value="seconds">seconds</option>
              <option value="minutes">minutes</option>
            </select>
          </div>
        );
      case 'notification':
        return (
          <div className="space-y-2">
            <input type="text" value={c.notifTitle || ''} onChange={e => set('notifTitle', e.target.value)} placeholder="Title" className="w-full bg-theme-background border border-theme-border/20 rounded-lg px-3 py-1.5 text-xs text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
            <input type="text" value={c.notifMessage || ''} onChange={e => set('notifMessage', e.target.value)} placeholder="Message (optional)" className="w-full bg-theme-background border border-theme-border/20 rounded-lg px-3 py-1.5 text-xs text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
            <select value={c.notifType || 'info'} onChange={e => set('notifType', e.target.value)} className="bg-theme-background border border-theme-border/20 rounded-lg px-2 py-1.5 text-xs text-theme-text outline-none focus:border-theme-icon/50">
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
        );
      case 'condition':
        return (
          <div className="space-y-2">
            <input type="text" value={c.conditionVariable || ''} onChange={e => set('conditionVariable', e.target.value)} placeholder="Variable name" className="w-full bg-theme-background border border-theme-border/20 rounded-lg px-3 py-1.5 text-xs text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 font-mono" />
            <div className="flex gap-2">
              <select value={c.conditionOperator || 'equals'} onChange={e => set('conditionOperator', e.target.value)} className="bg-theme-background border border-theme-border/20 rounded-lg px-2 py-1.5 text-xs text-theme-text outline-none focus:border-theme-icon/50">
                <option value="equals">equals</option>
                <option value="not-equals">not equals</option>
                <option value="contains">contains</option>
                <option value="is-empty">is empty</option>
                <option value="is-not-empty">is not empty</option>
              </select>
              {!['is-empty', 'is-not-empty'].includes(c.conditionOperator || '') && (
                <input type="text" value={c.conditionValue || ''} onChange={e => set('conditionValue', e.target.value)} placeholder="Value" className="flex-1 bg-theme-background border border-theme-border/20 rounded-lg px-3 py-1.5 text-xs text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-theme-text">{workflow ? 'Edit Workflow' : 'New Workflow'}</h2>
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-theme-surface/60 transition-colors">
          <FaClose className="w-4 h-4 text-theme-text/50" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-theme-text/60 mb-1 block">Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Workflow name" className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
        </div>
        <div>
          <label className="text-xs font-medium text-theme-text/60 mb-1 block">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="What does this workflow do?" className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 resize-y" />
        </div>
        <div>
          <label className="text-xs font-medium text-theme-text/60 mb-1 block">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="bg-theme-background border border-theme-border/30 rounded-xl px-3 py-2.5 text-sm text-theme-text outline-none focus:border-theme-icon/50">
            <option value="custom">Custom</option>
            <option value="morning">Morning Routine</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-medium text-theme-text/60 uppercase tracking-wider">Steps ({steps.length})</label>
          <button onClick={() => addStep()} className="flex items-center gap-1 text-xs text-theme-icon hover:underline">
            <FaPlus className="w-2.5 h-2.5" /> Add Step
          </button>
        </div>
        <div className="space-y-2">
          {steps.map((step, idx) => (
            <div key={step.id} className="bg-theme-background border border-theme-border/20 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-theme-text/30 font-mono w-6">{idx + 1}.</span>
                <select value={step.actionType} onChange={e => updateStep(idx, 'actionType', e.target.value)} className="bg-theme-surface border border-theme-border/20 rounded-lg px-2 py-1 text-xs text-theme-text outline-none focus:border-theme-icon/50">
                  {ACTION_TYPES.map(at => <option key={at} value={at}>{ACTION_TYPE_LABELS[at]}</option>)}
                </select>
                <input type="text" value={step.label} onChange={e => updateStep(idx, 'label', e.target.value)} placeholder="Step label" className="flex-1 bg-theme-surface border border-theme-border/20 rounded-lg px-2 py-1 text-xs text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
                <div className="flex items-center gap-0.5">
                  <button onClick={() => moveStep(idx, -1)} disabled={idx === 0} className="p-1 text-theme-text/30 hover:text-theme-text/60 disabled:opacity-20"><FaArrowUp className="w-2.5 h-2.5" /></button>
                  <button onClick={() => moveStep(idx, 1)} disabled={idx === steps.length - 1} className="p-1 text-theme-text/30 hover:text-theme-text/60 disabled:opacity-20"><FaArrowDown className="w-2.5 h-2.5" /></button>
                  <button onClick={() => removeStep(idx)} disabled={steps.length <= 1} className="p-1 text-theme-text/30 hover:text-red-400 disabled:opacity-20"><FaTimes className="w-2.5 h-2.5" /></button>
                </div>
              </div>
              <div className="pl-8">{renderConfig(step, idx)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={save} disabled={!name.trim() || saving} className="flex items-center gap-2 px-6 py-2.5 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors disabled:opacity-50">
          <FaSave className="w-3.5 h-3.5" />
          {saving ? 'Saving...' : 'Save Workflow'}
        </button>
        <button onClick={onCancel} className="px-6 py-2.5 bg-theme-surface border border-theme-border/50 text-theme-text rounded-xl text-sm font-medium hover:bg-theme-surface/80 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}
