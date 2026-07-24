import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  FaPlus, FaTimes, FaArrowUp, FaArrowDown, FaSave, FaArrowLeft,
  FaSearch, FaGripVertical, FaCheck, FaFolderOpen,
} from 'react-icons/fa';
import type { Workflow, WorkflowStep, ActionType } from '../types';
import { ACTION_TYPE_LABELS, CATEGORIES, CATEGORY_LABELS } from '../types';
import {
  ACTION_META, ACTION_GROUPS, WORKFLOW_TEMPLATES,
  newStep, stepsFromTemplate, applyProjectPathToSteps, type WorkflowTemplate,
} from '../actionCatalog';
import { database } from '../../../database';
import type { Project } from '../../projects/types';

interface Props {
  workflow?: Workflow | null;
  onSave: (data: { name: string; description: string; steps: string; category: string }) => Promise<void>;
  onCancel: () => void;
}

const ic = 'w-full bg-theme-background border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text placeholder:text-theme-text/30 outline-none focus:border-theme-icon/50 transition-colors';
const sc = 'bg-theme-background border border-theme-border/20 rounded-lg px-2 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50';

function PathWithProject({
  value,
  onChange,
  projects,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  projects: Project[];
  placeholder?: string;
}) {
  const withPath = projects.filter(p => p.local_path?.trim());
  return (
    <div className="space-y-1.5">
      <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={ic} />
      {withPath.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {withPath.slice(0, 8).map(p => (
            <button
              key={p.id}
              type="button"
              title={p.local_path}
              onClick={() => onChange(p.local_path)}
              className="px-2 py-1 rounded-md text-[10px] bg-theme-surface border border-theme-border/15 text-theme-text/55 hover:text-theme-icon hover:border-theme-icon/30 transition-colors max-w-[140px] truncate"
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ConfigForm({
  step,
  onChange,
  projects,
}: {
  step: WorkflowStep;
  onChange: (field: string, value: any) => void;
  projects: Project[];
}) {
  const c = step.config;
  const set = (f: string, v: any) => onChange(f, v);
  const scripts = useMemo(() => {
    const list: { name: string; cmd: string; project: string }[] = [];
    for (const p of projects) {
      for (const [key, cmd] of Object.entries(p.scripts || {})) {
        list.push({ name: key, cmd, project: p.name });
      }
    }
    return list.slice(0, 12);
  }, [projects]);

  return (
    <div className="space-y-3">
      {(() => {
        switch (step.actionType) {
          case 'open-folder':
          case 'open-vscode':
          case 'open-terminal':
            return (
              <Field label="Path">
                <PathWithProject
                  value={c.path || ''}
                  onChange={v => set('path', v)}
                  projects={projects}
                  placeholder="Pick a project below or paste a folder path"
                />
              </Field>
            );
          case 'open-file':
            return (
              <Field label="File path">
                <input value={c.filePath || c.path || ''} onChange={e => set('filePath', e.target.value)} placeholder="C:\\path\\file.txt" className={ic} />
              </Field>
            );
          case 'open-url':
            return (
              <Field label="URL">
                <input value={c.url || ''} onChange={e => set('url', e.target.value)} placeholder="https://localhost:5173" className={ic} />
              </Field>
            );
          case 'open-application':
            return (
              <>
                <Field label="App path or name"><input value={c.appPath || ''} onChange={e => set('appPath', e.target.value)} placeholder="code, chrome, notepad…" className={ic} /></Field>
                <Field label="Arguments"><input value={c.appArgs || ''} onChange={e => set('appArgs', e.target.value)} placeholder="Optional" className={ic} /></Field>
              </>
            );
          case 'run-command':
            return (
              <>
                <Field label="Command">
                  <input value={c.command || ''} onChange={e => set('command', e.target.value)} placeholder="git status · npm run dev · taskmgr" className={`${ic} font-mono`} />
                </Field>
                <Field label="Working directory">
                  <PathWithProject
                    value={c.commandCwd || ''}
                    onChange={v => set('commandCwd', v)}
                    projects={projects}
                    placeholder="Project folder — required for git/npm in that repo"
                  />
                </Field>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['git status', 'git pull', 'npm run dev', 'npm run build', 'taskmgr', 'ipconfig /flushdns'].map(cmd => (
                    <button key={cmd} type="button" onClick={() => set('command', cmd)}
                      className="px-2 py-1 rounded-md text-[10px] font-mono bg-theme-surface border border-theme-border/15 text-theme-text/50 hover:text-theme-icon hover:border-theme-icon/30 transition-colors">
                      {cmd}
                    </button>
                  ))}
                </div>
                {scripts.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[9px] uppercase tracking-wider text-theme-text/25 mb-1">From your projects</p>
                    <div className="flex flex-wrap gap-1.5">
                      {scripts.map(s => (
                        <button
                          key={`${s.project}-${s.name}`}
                          type="button"
                          title={s.cmd}
                          onClick={() => {
                            set('command', s.cmd);
                            const proj = projects.find(p => p.name === s.project);
                            if (proj?.local_path) set('commandCwd', proj.local_path);
                          }}
                          className="px-2 py-1 rounded-md text-[10px] bg-theme-surface border border-theme-border/15 text-theme-text/50 hover:text-theme-icon hover:border-theme-icon/30 transition-colors"
                        >
                          {s.name} · {s.project}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          case 'run-script':
            return <Field label="Script path"><input value={c.scriptPath || ''} onChange={e => set('scriptPath', e.target.value)} placeholder="scripts\\deploy.bat" className={ic} /></Field>;
          case 'wait':
            return (
              <div className="flex items-center gap-2">
                <input type="number" min={1} value={c.waitDuration || 3} onChange={e => set('waitDuration', parseInt(e.target.value) || 1)} className="w-24 bg-theme-background border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none" />
                <select value={c.waitUnit || 'seconds'} onChange={e => set('waitUnit', e.target.value)} className={sc}>
                  <option value="seconds">seconds</option>
                  <option value="minutes">minutes</option>
                </select>
              </div>
            );
          case 'notification':
            return (
              <>
                <Field label="Title"><input value={c.notifTitle || ''} onChange={e => set('notifTitle', e.target.value)} placeholder="Title" className={ic} /></Field>
                <Field label="Message"><input value={c.notifMessage || ''} onChange={e => set('notifMessage', e.target.value)} placeholder="Optional" className={ic} /></Field>
                <Field label="Type">
                  <select value={c.notifType || 'info'} onChange={e => set('notifType', e.target.value)} className={sc}>
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </Field>
              </>
            );
          case 'copy-file':
          case 'move-file':
            return (
              <>
                <Field label="Source"><input value={c.sourcePath || ''} onChange={e => set('sourcePath', e.target.value)} placeholder="Source path" className={ic} /></Field>
                <Field label="Destination"><input value={c.destPath || ''} onChange={e => set('destPath', e.target.value)} placeholder="Destination path" className={ic} /></Field>
              </>
            );
          case 'delete-file':
            return <Field label="Path"><input value={c.filePath || ''} onChange={e => set('filePath', e.target.value)} placeholder="File to delete" className={ic} /></Field>;
          case 'compress-zip':
            return (
              <>
                <Field label="Folder"><input value={c.sourcePath || ''} onChange={e => set('sourcePath', e.target.value)} placeholder="Folder to zip" className={ic} /></Field>
                <Field label="Output zip"><input value={c.archivePath || ''} onChange={e => set('archivePath', e.target.value)} placeholder="backup.zip" className={ic} /></Field>
              </>
            );
          case 'extract-zip':
            return (
              <>
                <Field label="Archive"><input value={c.archivePath || ''} onChange={e => set('archivePath', e.target.value)} placeholder="archive.zip" className={ic} /></Field>
                <Field label="Extract to"><input value={c.extractDest || '.'} onChange={e => set('extractDest', e.target.value)} placeholder="." className={ic} /></Field>
              </>
            );
          default:
            return null;
        }
      })()}

      <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={!!c.continueOnError}
          onChange={e => set('continueOnError', e.target.checked)}
          className="rounded border-theme-border/40"
        />
        <span className="text-[11px] text-theme-text/50">Continue workflow if this step fails</span>
      </label>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[10px] uppercase tracking-wider text-theme-text/35 font-medium">{label}</span>
      {children}
    </label>
  );
}

function TemplatePicker({ onPick, onSkip }: { onPick: (t: WorkflowTemplate) => void; onSkip: () => void }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b border-theme-border/10 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onSkip} className="p-1.5 rounded-lg hover:bg-theme-border/10 transition-colors">
            <FaArrowLeft className="w-4 h-4 text-theme-text/50" />
          </button>
          <div>
            <h2 className="text-base font-semibold text-theme-text">New workflow</h2>
            <p className="text-[11px] text-theme-text/40">Start from a template — then connect a project</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl">
          {WORKFLOW_TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => onPick(t)}
              className="text-left rounded-xl border border-theme-border/15 bg-theme-surface p-4 hover:border-theme-icon/40 hover:bg-theme-icon/5 transition-all group"
            >
              <p className="text-sm font-medium text-theme-text group-hover:text-theme-icon">{t.name}</p>
              <p className="text-[11px] text-theme-text/40 mt-1 line-clamp-2">{t.description}</p>
              <p className="text-[10px] text-theme-text/25 mt-3">
                {t.steps.length ? `${t.steps.length} steps · ${CATEGORY_LABELS[t.category] || t.category}` : 'Empty canvas'}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WorkflowBuilder({ workflow, onSave, onCancel }: Props) {
  const isEdit = !!workflow;
  const [phase, setPhase] = useState<'template' | 'edit'>(isEdit ? 'edit' : 'template');
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [category, setCategory] = useState(workflow?.category || 'custom');
  const [steps, setSteps] = useState<WorkflowStep[]>(
    workflow?.steps?.length ? workflow.steps : [newStep('run-command')],
  );
  const [saving, setSaving] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [actionQuery, setActionQuery] = useState('');
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [boundProjectId, setBoundProjectId] = useState<number | ''>('');

  useEffect(() => {
    database.getProjects().then(list => {
      setProjects((list || []).filter((p: Project) => p.status !== 'archived'));
    }).catch(() => setProjects([]));
  }, []);

  const projectsWithPath = useMemo(
    () => projects.filter(p => p.local_path?.trim()),
    [projects],
  );

  const boundProject = useMemo(
    () => projectsWithPath.find(p => p.id === boundProjectId) || null,
    [projectsWithPath, boundProjectId],
  );

  const bindProject = useCallback((projectId: number | '') => {
    setBoundProjectId(projectId);
    if (projectId === '') return;
    const p = projectsWithPath.find(x => x.id === projectId);
    if (!p?.local_path) return;
    setSteps(prev => applyProjectPathToSteps(prev, p.local_path));
    if (!name.trim() || name.includes('·')) {
      // keep existing custom names
    }
  }, [projectsWithPath, name]);

  const applyTemplate = (t: WorkflowTemplate) => {
    setName(t.id === 'blank' ? '' : t.name);
    setDescription(t.id === 'blank' ? '' : t.description);
    setCategory(t.category);
    let s = stepsFromTemplate(t);
    if (boundProject?.local_path) s = applyProjectPathToSteps(s, boundProject.local_path);
    setSteps(s);
    setSelectedIdx(0);
    setPhase('edit');
  };

  const addStep = useCallback((actionType?: ActionType, afterIdx?: number) => {
    let s = newStep(actionType || 'run-command');
    if (boundProject?.local_path) {
      s = applyProjectPathToSteps([s], boundProject.local_path)[0];
    }
    setSteps(prev => {
      const next = [...prev];
      const at = afterIdx !== undefined ? afterIdx + 1 : next.length;
      next.splice(at, 0, s);
      return next;
    });
    setSelectedIdx(afterIdx !== undefined ? afterIdx + 1 : steps.length);
    setShowActionPicker(false);
    setActionQuery('');
  }, [steps.length, boundProject]);

  const removeStep = useCallback((idx: number) => {
    setSteps(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== idx);
      setSelectedIdx(i => Math.min(i, next.length - 1));
      return next;
    });
  }, []);

  const moveStep = useCallback((idx: number, dir: -1 | 1) => {
    setSteps(prev => {
      const next = [...prev];
      const t = idx + dir;
      if (t < 0 || t >= next.length) return next;
      [next[idx], next[t]] = [next[t], next[idx]];
      setSelectedIdx(t);
      return next;
    });
  }, []);

  const updateStep = useCallback((idx: number, field: string, value: any) => {
    setSteps(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      if (field === 'actionType') {
        const at = value as ActionType;
        let next = { ...s, actionType: at, label: ACTION_TYPE_LABELS[at], config: { ...ACTION_META[at].defaults } };
        if (boundProject?.local_path) {
          next = applyProjectPathToSteps([next], boundProject.local_path)[0];
        }
        return next;
      }
      if (field === 'label') return { ...s, label: value };
      return { ...s, config: { ...s.config, [field]: value } };
    }));
  }, [boundProject]);

  const save = useCallback(async () => {
    if (!name.trim() || !steps.length) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        steps: JSON.stringify(steps),
        category,
      });
    } finally {
      setSaving(false);
    }
  }, [name, description, steps, category, onSave]);

  const filteredActions = useMemo(() => {
    const q = actionQuery.trim().toLowerCase();
    return (Object.values(ACTION_META) as typeof ACTION_META[ActionType][]).filter(a => {
      if (!q) return true;
      return a.type.includes(q) || ACTION_TYPE_LABELS[a.type].toLowerCase().includes(q) || a.tip.toLowerCase().includes(q);
    });
  }, [actionQuery]);

  if (phase === 'template') {
    return <TemplatePicker onPick={applyTemplate} onSkip={() => { setPhase('edit'); }} />;
  }

  const sel = steps[selectedIdx] || steps[0];
  const selMeta = sel ? ACTION_META[sel.actionType] : null;

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between px-5 py-3 border-b border-theme-border/10 shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-theme-border/10 transition-colors shrink-0">
            <FaArrowLeft className="w-4 h-4 text-theme-text/50" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-theme-text truncate">{isEdit ? 'Edit workflow' : 'Build workflow'}</h2>
            <p className="text-[10px] text-theme-text/35">{steps.length} step{steps.length !== 1 ? 's' : ''} · connect a project, then save & run</p>
          </div>
        </div>
        <button
          onClick={save}
          disabled={!name.trim() || saving || !steps.length}
          className="inline-flex items-center gap-2 px-4 py-2 bg-theme-icon text-white text-xs font-medium rounded-xl hover:bg-theme-icon/90 transition-colors disabled:opacity-40 shrink-0"
        >
          <FaSave className="w-3.5 h-3.5" />
          {saving ? 'Saving…' : 'Save & ready to run'}
        </button>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="w-80 shrink-0 border-r border-theme-border/10 overflow-y-auto p-4 space-y-4">
          <div className="rounded-xl border border-theme-icon/20 bg-theme-icon/5 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <FaFolderOpen className="w-3.5 h-3.5 text-theme-icon shrink-0" />
              <span className="text-[10px] uppercase tracking-wider text-theme-icon/80 font-medium">Use my project</span>
            </div>
            {projectsWithPath.length === 0 ? (
              <p className="text-[11px] text-theme-text/40 leading-relaxed">
                Add a project with a local folder path in Projects — then pick it here to fill open/run paths.
              </p>
            ) : (
              <>
                <select
                  value={boundProjectId === '' ? '' : String(boundProjectId)}
                  onChange={e => bindProject(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-theme-background border border-theme-border/20 rounded-lg px-2 py-2 text-xs text-theme-text outline-none"
                >
                  <option value="">Choose a project…</option>
                  {projectsWithPath.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {boundProject && (
                  <p className="text-[10px] text-theme-text/40 font-mono truncate" title={boundProject.local_path}>
                    {boundProject.local_path}
                  </p>
                )}
                {boundProject && (
                  <button
                    type="button"
                    onClick={() => setSteps(prev => applyProjectPathToSteps(prev, boundProject.local_path))}
                    className="text-[11px] text-theme-icon hover:underline"
                  >
                    Fill all steps with this path
                  </button>
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Workflow name *"
              className="w-full bg-theme-surface border border-theme-border/20 rounded-xl px-3 py-2.5 text-sm text-theme-text placeholder:text-theme-text/30 outline-none focus:border-theme-icon/50"
            />
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="What does this do day-to-day?"
              className="w-full bg-theme-surface border border-theme-border/20 rounded-xl px-3 py-2 text-xs text-theme-text placeholder:text-theme-text/30 outline-none focus:border-theme-icon/50 resize-none"
            />
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-theme-surface border border-theme-border/20 rounded-xl px-3 py-2 text-xs text-theme-text outline-none">
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-theme-text/35 font-medium">Steps</span>
              <button onClick={() => setShowActionPicker(v => !v)} className="text-[11px] text-theme-icon hover:underline inline-flex items-center gap-1">
                <FaPlus className="w-2.5 h-2.5" /> Add
              </button>
            </div>

            {showActionPicker && (
              <div className="mb-3 rounded-xl border border-theme-border/20 bg-theme-surface p-2 space-y-2">
                <div className="relative">
                  <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-theme-text/30" />
                  <input
                    autoFocus
                    value={actionQuery}
                    onChange={e => setActionQuery(e.target.value)}
                    placeholder="Search actions…"
                    className="w-full bg-theme-background border border-theme-border/15 rounded-lg pl-8 pr-2 py-1.5 text-[11px] text-theme-text outline-none"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {ACTION_GROUPS.map(g => {
                    const items = filteredActions.filter(a => a.group === g.id);
                    if (!items.length) return null;
                    return (
                      <div key={g.id}>
                        <p className="text-[9px] uppercase tracking-wider text-theme-text/25 px-1 mb-1">{g.label}</p>
                        <div className="space-y-0.5">
                          {items.map(a => {
                            const Icon = a.icon;
                            return (
                              <button
                                key={a.type}
                                onClick={() => addStep(a.type, selectedIdx)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-theme-icon/10 transition-colors"
                              >
                                <Icon className={`w-3 h-3 ${a.color}`} />
                                <span className="text-[11px] text-theme-text flex-1">{ACTION_TYPE_LABELS[a.type]}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-1">
              {steps.map((step, idx) => {
                const meta = ACTION_META[step.actionType];
                const Icon = meta?.icon;
                const active = selectedIdx === idx;
                return (
                  <div
                    key={step.id}
                    onClick={() => setSelectedIdx(idx)}
                    className={`group flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-colors border ${
                      active
                        ? 'bg-theme-icon/10 border-theme-icon/25'
                        : 'bg-theme-background border-theme-border/10 hover:border-theme-border/25'
                    }`}
                  >
                    <FaGripVertical className="w-2.5 h-2.5 text-theme-text/15 shrink-0" />
                    <span className="text-[10px] text-theme-text/25 font-mono w-4 text-right shrink-0">{idx + 1}</span>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${meta?.color || ''} bg-theme-icon/5`}>
                      {Icon ? <Icon className="w-3 h-3" /> : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-theme-text truncate">{step.label}</p>
                      <p className="text-[9px] text-theme-text/30 font-mono truncate">{meta?.preview(step.config)}</p>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={e => { e.stopPropagation(); moveStep(idx, -1); }} disabled={idx === 0} className="p-1 text-theme-text/30 hover:text-theme-text disabled:opacity-20"><FaArrowUp className="w-2.5 h-2.5" /></button>
                      <button type="button" onClick={e => { e.stopPropagation(); moveStep(idx, 1); }} disabled={idx === steps.length - 1} className="p-1 text-theme-text/30 hover:text-theme-text disabled:opacity-20"><FaArrowDown className="w-2.5 h-2.5" /></button>
                      <button type="button" onClick={e => { e.stopPropagation(); removeStep(idx); }} disabled={steps.length <= 1} className="p-1 text-theme-text/30 hover:text-red-400 disabled:opacity-20"><FaTimes className="w-2.5 h-2.5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-theme-background/30">
          {sel && selMeta && (
            <div className="max-w-xl space-y-5">
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${selMeta.color} bg-theme-surface border border-theme-border/15`}>
                  <selMeta.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <input
                    value={sel.label}
                    onChange={e => updateStep(selectedIdx, 'label', e.target.value)}
                    className="w-full bg-transparent text-base font-semibold text-theme-text outline-none placeholder:text-theme-text/30"
                    placeholder="Step label"
                  />
                  <p className="text-[11px] text-theme-text/40">{selMeta.tip}</p>
                  <select
                    value={sel.actionType}
                    onChange={e => updateStep(selectedIdx, 'actionType', e.target.value)}
                    className={`${sc} max-w-xs`}
                  >
                    {Object.keys(ACTION_META).map(at => (
                      <option key={at} value={at}>{ACTION_TYPE_LABELS[at as ActionType]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-theme-border/15 bg-theme-surface p-4">
                <p className="text-[10px] uppercase tracking-wider text-theme-text/35 font-medium mb-3">Configuration</p>
                <ConfigForm step={sel} onChange={(f, v) => updateStep(selectedIdx, f, v)} projects={projectsWithPath} />
              </div>

              <div className="rounded-xl border border-theme-border/10 bg-theme-surface/50 px-4 py-3 flex items-start gap-2">
                <FaCheck className="w-3 h-3 text-theme-icon mt-0.5 shrink-0" />
                <p className="text-[11px] text-theme-text/45 leading-relaxed">
                  Pick a project above to wire open/editor/terminal/git to that folder.
                  You can still paste any absolute path. System commands need the DevOS desktop app.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
