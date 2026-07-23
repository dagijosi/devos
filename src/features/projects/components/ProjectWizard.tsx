import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight, FaFolder, FaCheck, FaTimes, FaPlus } from 'react-icons/fa';
import { PROJECTS } from '../../../routes/types/routeConstants';
import { database } from '../../../database';

const isTauri = () => typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;

const techOptions = ['React', 'Node', 'Tailwind', 'TypeScript', 'Flutter', 'Laravel', 'Tauri', 'Docker', 'Next.js', 'Vue', 'Angular', 'Python', 'Go', 'Rust', 'SQLite', 'PostgreSQL'];

interface WizardStepProps {
  step: number;
  data: any;
  setData: (d: any) => void;
  onNext: () => void;
  onBack: () => void;
}

function StepName({ data, setData, onNext }: WizardStepProps) {
  const valid = data.name.trim().length > 0;
  return (
    <div className="space-y-5">
      <h3 className="text-base font-semibold text-theme-text">Project Name</h3>
      <div>
        <label className="text-xs text-theme-text/60 mb-1 block">Name</label>
        <input type="text" value={data.name} onChange={e => setData({ ...data, name: e.target.value })}
          placeholder="My Project" className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-3 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" autoFocus />
      </div>
      <div>
        <label className="text-xs text-theme-text/60 mb-1 block">Description</label>
        <textarea value={data.description} onChange={e => setData({ ...data, description: e.target.value })}
          placeholder="What does this project do?" rows={3} className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-3 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 resize-none" />
      </div>
      <div>
        <label className="text-xs text-theme-text/60 mb-1 block">Category</label>
        <select value={data.category} onChange={e => setData({ ...data, category: e.target.value })}
          className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-3 text-sm text-theme-text outline-none focus:border-theme-icon/50">
          <option value="">General</option>
          <option value="web">Web App</option>
          <option value="mobile">Mobile</option>
          <option value="backend">Backend</option>
          <option value="desktop">Desktop</option>
          <option value="library">Library</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="flex justify-end">
        <button onClick={onNext} disabled={!valid} className="flex items-center gap-2 px-5 py-2.5 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 disabled:opacity-40 transition-colors">
          Next <FaArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function StepPath({ data, setData, onNext, onBack }: WizardStepProps) {
  const folderRef = useRef<HTMLInputElement>(null);

  const handleFolderPick = async () => {
    if (isTauri()) {
      try {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const selected = await open({ directory: true, multiple: false, title: 'Select Project Folder' });
        if (selected) {
          setData({ ...data, local_path: selected });
        }
      } catch {
        const input = folderRef.current;
        if (input) { input.value = ''; input.click(); }
      }
    } else {
      const input = folderRef.current;
      if (input) { input.value = ''; input.click(); }
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isTauri()) return;
    const file = e.target.files?.[0];
    if (file) {
      const path = (file as any).path || file.webkitRelativePath.split('/')[0] || '';
      if (path) setData({ ...data, local_path: path });
    }
  };

  return (
    <div className="space-y-5">
      <h3 className="text-base font-semibold text-theme-text">Location & Repository</h3>
      <div>
        <label className="text-xs text-theme-text/60 mb-1 block">Local Path</label>
        <div className="flex items-center gap-2">
          <input type="text" value={data.local_path} onChange={e => setData({ ...data, local_path: e.target.value })}
            placeholder="C:\Projects\my-app" className="flex-1 bg-theme-background border border-theme-border/30 rounded-xl px-4 py-3 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
          <button type="button" onClick={handleFolderPick} className="p-3 bg-theme-surface border border-theme-border/30 rounded-xl text-theme-text/50 hover:text-theme-text"><FaFolder className="w-4 h-4" /></button>
          <input ref={folderRef} type="file" webkitdirectory="" directory="" onChange={handleFolderChange}
            style={{ display: 'none' }} />
        </div>
      </div>
      <div>
        <label className="text-xs text-theme-text/60 mb-1 block">Repository URL (optional)</label>
        <input type="text" value={data.repository_url} onChange={e => setData({ ...data, repository_url: e.target.value })}
          placeholder="https://github.com/user/repo" className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-3 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
      </div>
      <div className="flex justify-between">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2.5 text-sm text-theme-text/60 hover:text-theme-text"><FaArrowLeft className="w-3 h-3" /> Back</button>
        <button onClick={onNext} className="flex items-center gap-2 px-5 py-2.5 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors">
          Next <FaArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function StepTech({ data, setData, onNext, onBack }: WizardStepProps) {
  const toggle = (t: string) => {
    const next = data.technology.includes(t)
      ? data.technology.filter((x: string) => x !== t)
      : [...data.technology, t];
    setData({ ...data, technology: next });
  };

  return (
    <div className="space-y-5">
      <h3 className="text-base font-semibold text-theme-text">Technologies</h3>
      <p className="text-xs text-theme-text/50">Select the technologies used in this project</p>
      <div className="flex flex-wrap gap-2">
        {techOptions.map(t => {
          const selected = data.technology.includes(t);
          return (
            <button key={t} onClick={() => toggle(t)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                selected
                  ? 'bg-theme-icon/10 text-theme-icon border-theme-icon/30'
                  : 'bg-theme-background text-theme-text/50 border-theme-border/20 hover:border-theme-border/40'
              }`}
            >
              {selected && <FaCheck className="w-3 h-3" />}
              {t}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2.5 text-sm text-theme-text/60 hover:text-theme-text"><FaArrowLeft className="w-3 h-3" /> Back</button>
        <button onClick={onNext} className="flex items-center gap-2 px-5 py-2.5 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors">
          Next <FaArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function StepScripts({ data, setData, onNext, onBack }: WizardStepProps) {
  const add = () => setData({ ...data, scripts: [...data.scripts, { name: '', command: '' }] });
  const update = (i: number, field: string, val: string) => {
    const next = [...data.scripts];
    next[i] = { ...next[i], [field]: val };
    setData({ ...data, scripts: next });
  };
  const remove = (i: number) => setData({ ...data, scripts: data.scripts.filter((_: any, idx: number) => idx !== i) });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-theme-text">Scripts</h3>
        <button onClick={add} className="flex items-center gap-1.5 text-xs text-theme-icon hover:text-theme-icon/80"><FaPlus className="w-2.5 h-2.5" /> Add Script</button>
      </div>
      <p className="text-xs text-theme-text/50">Add common commands for this project</p>
      <div className="space-y-3">
        {data.scripts.map((s: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <input type="text" value={s.name} onChange={e => update(i, 'name', e.target.value)} placeholder="e.g. dev" className="flex-[2] bg-theme-background border border-theme-border/30 rounded-xl px-3 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
            <input type="text" value={s.command} onChange={e => update(i, 'command', e.target.value)} placeholder="e.g. npm run dev" className="flex-[3] bg-theme-background border border-theme-border/30 rounded-xl px-3 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
            <button onClick={() => remove(i)} className="p-2 rounded-lg text-theme-text/30 hover:text-red-400 hover:bg-red-500/10"><FaTimes className="w-3 h-3" /></button>
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2.5 text-sm text-theme-text/60 hover:text-theme-text"><FaArrowLeft className="w-3 h-3" /> Back</button>
        <button onClick={onNext} className="flex items-center gap-2 px-5 py-2.5 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors">
          Next <FaArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function StepFinish({ data, onBack, onFinish }: WizardStepProps & { onFinish: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
          <FaCheck className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-theme-text">Ready to Create</h3>
          <p className="text-xs text-theme-text/50">Review the project details below</p>
        </div>
      </div>

      <div className="bg-theme-background rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-theme-text/50">Name</span><span className="text-theme-text font-medium">{data.name}</span></div>
        <div className="flex justify-between"><span className="text-theme-text/50">Description</span><span className="text-theme-text/80">{data.description || '—'}</span></div>
        <div className="flex justify-between"><span className="text-theme-text/50">Category</span><span className="text-theme-text/80">{data.category || 'General'}</span></div>
        <div className="flex justify-between"><span className="text-theme-text/50">Path</span><span className="text-theme-text/80 truncate max-w-[200px]">{data.local_path || '—'}</span></div>
        {data.technology.length > 0 && (
          <div className="flex justify-between"><span className="text-theme-text/50">Technologies</span><span className="text-theme-text/80">{data.technology.join(', ')}</span></div>
        )}
        {data.scripts.length > 0 && (
          <div className="flex justify-between"><span className="text-theme-text/50">Scripts</span><span className="text-theme-text/80">{data.scripts.length} configured</span></div>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2.5 text-sm text-theme-text/60 hover:text-theme-text"><FaArrowLeft className="w-3 h-3" /> Back</button>
        <button onClick={onFinish} className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">
          <FaCheck className="w-3 h-3" /> Create Project
        </button>
      </div>
    </div>
  );
}

const STEPS = [
  { title: 'Name & Description', component: StepName },
  { title: 'Path & Repository', component: StepPath },
  { title: 'Technologies', component: StepTech },
  { title: 'Scripts', component: StepScripts },
  { title: 'Review', component: StepFinish },
];

export function ProjectWizard({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState({
    name: '', description: '', category: '', local_path: '', repository_url: '',
    technology: [] as string[], scripts: [] as { name: string; command: string }[],
  });

  const handleFinish = async () => {
    setBusy(true);
    try {
      const scriptsObj: Record<string, string> = {};
      data.scripts.forEach((s: any) => { if (s.name && s.command) scriptsObj[s.name] = s.command; });
      const project = await database.createProject({
        name: data.name, description: data.description, tags: [], technology: data.technology,
        repository_url: data.repository_url, local_path: data.local_path, status: 'active',
        icon: 'folder', color: '#6366f1', category: data.category,
        scripts: scriptsObj, environment: {},
      } as any);
      if (project?.id) {
        for (const s of data.scripts) {
          if (s.name && s.command) await database.addProjectScript(project.id, s.name, s.command);
        }
        await database.addProjectActivity(project.id, 'Project created', 'create');
      }
      navigate(`${PROJECTS}/${project?.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const StepComponent = STEPS[step].component;

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-theme-surface/50 text-theme-text/50 hover:text-theme-text">
          <FaTimes className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-theme-icon' : 'bg-theme-border/20'}`} />
            ))}
          </div>
          <p className="text-xs text-theme-text/40 mt-2">Step {step + 1} of {STEPS.length}: {STEPS[step].title}</p>
        </div>
      </div>

      <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-6">
        <StepComponent step={step} data={data} setData={setData}
          onNext={() => setStep(s => Math.min(s + 1, STEPS.length - 1))}
          onBack={() => setStep(s => Math.max(s - 1, 0))}
          onFinish={handleFinish}
        />
      </div>
    </div>
  );
}
