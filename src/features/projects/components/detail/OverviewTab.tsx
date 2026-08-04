import { useEffect, useState } from 'react';
import { FaFolder, FaGithub, FaTerminal, FaCode, FaPlay, FaHistory, FaChevronDown } from 'react-icons/fa';
import { toast } from 'sonner';
import { database } from '../../../../database';
import type { Project } from '../../types';
import { openFolder, openEditor, openVSCode, openTerminal, openBrowser, runScript as runProjectScript } from '../../utils/projectActions';
import { useDetectedEditors } from '../../hooks/useDetectedEditors';
import { creditWork } from '../../../insights/activitySignal.store';
import { ServiceManager } from '../../../service-manager/ServiceManager';
import { OnboardingChecklist } from './OnboardingChecklist';

interface OverviewTabProps {
  project: Project;
  onRefresh: () => void;
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="bg-theme-surface border border-theme-border/20 rounded-2xl p-5">
      <p className={`text-2xl font-semibold ${accent || 'text-theme-text'} leading-tight`}>{value}</p>
      <p className="text-xs text-theme-text/40 mt-1">{label}</p>
    </div>
  );
}

export function OverviewTab({ project, onRefresh: _onRefresh }: OverviewTabProps) {
  void _onRefresh;
  const [activity, setActivity] = useState<any[]>([]);
  const [scripts, setScripts] = useState<any[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [gitInfo, setGitInfo] = useState<{ branch?: string } | null>(null);
  const [depsCount, setDepsCount] = useState(0);
  const { editors } = useDetectedEditors();
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [act, scr, tasks] = await Promise.all([
        database.getProjectActivity(project.id, 8),
        database.getProjectScripts(project.id),
        database.getProjectTasks(project.id),
      ]);
      setActivity(act || []);
      setScripts(scr || []);
      setPendingTasks((tasks || []).filter((t: any) => t.status !== 'done'));

      try {
        const { useActiveProjectStore } = await import('../../../../stores/activeProject.store');
        const state = useActiveProjectStore.getState();
        const active = state.recentProjects.find((p: any) => p.id === project.id);
        if (active?.branch) setGitInfo({ branch: active.branch });
      } catch {}

      if (project.scripts) {
        try {
          const parsed = typeof project.scripts === 'string' ? JSON.parse(project.scripts) : project.scripts;
          setDepsCount(Object.keys(parsed).length);
        } catch {}
      }
    };
    load();
  }, [project.id, project.local_path]);

  const handleRunScript = async (cmd: string) => {
    const r = await runProjectScript(cmd, project.local_path);
    if (r.success) toast.success(r.message);
    else toast.error(r.message);
  };

  const rawScriptsObj = typeof project.scripts === 'string'
    ? (() => { try { return JSON.parse(project.scripts); } catch { return {}; } })()
    : (project.scripts && typeof project.scripts === 'object' ? project.scripts : {});
  const allScripts = [
    ...Object.entries(rawScriptsObj).map(([k, v]) => ({ name: k, command: v })),
    ...scripts,
  ];

  const runConfigsTyped = allScripts.slice(0, 10).map((s) => ({ name: s.name, command: typeof s.command === 'string' ? s.command : '' }));
  const overdue = pendingTasks.filter((t: any) => t.due_date && new Date(t.due_date) < new Date()).length;

  const actionBtn = 'flex items-center gap-1.5 px-3.5 py-2.5 bg-theme-surface border border-theme-border/20 text-theme-text/70 rounded-xl text-sm font-medium hover:border-theme-border/40 hover:text-theme-text transition-all';
  const hasActions = !!project.local_path || !!project.repository_url;

  return (
    <div className="space-y-5">
      {/* Quick actions */}
      {hasActions && (
        <div className="flex items-center gap-2 flex-wrap">
          {project.local_path && (
            <>
              <button onClick={async () => { const r = await openFolder(project.local_path); if (r.success) toast.success(r.message); else toast.error(r.message); }} className={actionBtn}><FaFolder className="w-3.5 h-3.5" /> Open Folder</button>
              <div className="relative">
                <button onClick={() => setEditorOpen(o => !o)} className={actionBtn}>
                  <FaCode className="w-3.5 h-3.5" />
                  Open with
                  <FaChevronDown className="w-2.5 h-2.5" />
                </button>
                {editorOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setEditorOpen(false)} />
                    <div className="absolute left-0 top-full mt-1.5 z-20 w-56 max-h-80 overflow-y-auto bg-theme-surface border border-theme-border/20 rounded-xl py-1 shadow-xl shadow-black/20">
                      {editors.length > 0 ? (
                        editors.map(e => (
                          <button
                            key={e.id}
                            onClick={() => { setEditorOpen(false); openEditor(project.local_path, e).then(r => { if (r.success) { creditWork(10); toast.success(r.message); } else { toast.error(r.message); } }); }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-theme-text/70 hover:bg-theme-icon/5 hover:text-theme-text transition-colors text-left"
                          >
                            <FaCode className="w-3 h-3 text-theme-text/30 shrink-0" />
                            <span className="truncate">{e.name}</span>
                          </button>
                        ))
                      ) : (
                        <button
                          onClick={() => { setEditorOpen(false); openVSCode(project.local_path).then(r => r.success ? toast.success(r.message) : toast.error(r.message)); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-theme-text/70 hover:bg-theme-icon/5 hover:text-theme-text transition-colors text-left"
                        >
                          <FaCode className="w-3 h-3 text-theme-text/30 shrink-0" />
                          <span className="truncate">VS Code</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
              <button onClick={async () => { const r = await openTerminal(project.local_path); if (r.success) toast.success(r.message); else toast.error(r.message); }} className={actionBtn}><FaTerminal className="w-3.5 h-3.5" /> Terminal</button>
            </>
          )}
          {project.repository_url && (
            <button onClick={async () => { const r = await openBrowser(project.repository_url); if (r.success) toast.success(r.message); else toast.error(r.message); }} className={actionBtn}><FaGithub className="w-3.5 h-3.5" /> Repository</button>
          )}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending tasks" value={pendingTasks.length} />
        <StatCard label="Overdue" value={overdue} accent="text-red-400" />
        <StatCard label="Branch" value={gitInfo?.branch || '-'} />
        <StatCard label="Dependencies" value={depsCount || 0} />
      </div>

      <OnboardingChecklist project={project} />

      {/* Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {allScripts.length > 0 && (
          <div className="bg-theme-surface border border-theme-border/20 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-theme-text">Scripts</h3>
              <span className="text-xs text-theme-text/30">{allScripts.length}</span>
            </div>
            <div className="space-y-0.5">
              {allScripts.slice(0, 6).map((s, i) => (
                <div key={i} className="flex items-center justify-between px-2 py-2.5 group hover:bg-theme-icon/5 rounded-lg transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm text-theme-text">{s.name}</p>
                    <p className="text-[11px] text-theme-text/35 font-mono truncate">{s.command}</p>
                  </div>
                  <button onClick={() => handleRunScript(s.command)} className="p-2 -m-2 rounded-lg text-theme-text/25 hover:text-theme-icon hover:bg-theme-icon/10 transition-colors opacity-0 group-hover:opacity-100" title={`Run ${s.name}`}>
                    <FaPlay className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-theme-surface border border-theme-border/20 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-theme-text">Activity</h3>
            <FaHistory className="w-3 h-3 text-theme-text/25" />
          </div>
          {activity.length === 0 ? (
            <p className="text-xs text-theme-text/30 text-center py-8">No activity yet</p>
          ) : (
            <div className="space-y-0.5">
              {activity.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-theme-icon/5 transition-colors">
                  <p className="flex-1 min-w-0 text-sm text-theme-text truncate">{a.title}</p>
                  <p className="text-[11px] text-theme-text/30 shrink-0">{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {Object.keys(project.environment || {}).length > 0 && (
          <div className="bg-theme-surface border border-theme-border/20 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-theme-text mb-3">Environment</h3>
            <div className="space-y-0.5">
              {Object.entries(project.environment).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-2 py-2.5 rounded-lg hover:bg-theme-icon/5 transition-colors">
                  <span className="text-sm font-mono text-theme-text/70 truncate">{k}</span>
                  <span className="text-sm font-mono text-theme-text/35 truncate ml-4">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Running Services */}
      {runConfigsTyped.length > 0 && (
        <div className="bg-theme-surface border border-theme-border/20 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-theme-text mb-3">Running Services</h3>
          <ServiceManager projectId={project.id} localPath={project.local_path} runConfigs={runConfigsTyped} />
        </div>
      )}
    </div>
  );
}
