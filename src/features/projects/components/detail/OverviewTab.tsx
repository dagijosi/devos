import { useEffect, useState } from 'react';
import { FaFolder, FaGithub, FaTerminal, FaCode, FaClock, FaHistory, FaCircle, FaPlay, FaCalendarAlt, FaTasks, FaExclamationTriangle, FaCodeBranch, FaShieldAlt, FaCube, FaTag } from 'react-icons/fa';
import { toast } from 'sonner';
import { database } from '../../../../database';
import type { Project } from '../../types';
import { TechnologyBadge } from '../TechnologyBadge';
import { openFolder, openVSCode, openTerminal, openBrowser, runScript as runProjectScript } from '../../utils/projectActions';
import { ServiceManager } from '../../../service-manager/ServiceManager';
import { OnboardingChecklist } from './OnboardingChecklist';

interface OverviewTabProps {
  project: Project;
  onRefresh: () => void;
}

export function OverviewTab({ project, onRefresh: _onRefresh }: OverviewTabProps) {
  void _onRefresh;
  const [activity, setActivity] = useState<any[]>([]);
  const [scripts, setScripts] = useState<any[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [gitInfo, setGitInfo] = useState<{ branch?: string; ahead?: number; behind?: number; hasChanges?: boolean } | null>(null);
  const [depsCount, setDepsCount] = useState(0);

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

      // Load git info from active project store
      try {
        const { useActiveProjectStore } = await import('../../../../stores/activeProject.store');
        const state = useActiveProjectStore.getState();
        const active = state.recentProjects.find((p: any) => p.id === project.id);
        if (active?.branch) setGitInfo({ branch: active.branch });
      } catch {}

      // Count scripts as deps proxy
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

  const techArr = Array.isArray(project.technology)
    ? project.technology
    : typeof project.technology === 'string'
      ? (() => { try { return JSON.parse(project.technology); } catch { return []; } })()
      : [];
  const techs = techArr.slice(0, 6);
  const rawScriptsObj = typeof project.scripts === 'string'
    ? (() => { try { return JSON.parse(project.scripts); } catch { return {}; } })()
    : (project.scripts && typeof project.scripts === 'object' ? project.scripts : {});
  const scriptEntries = Object.entries(rawScriptsObj);
  const allScripts = [
    ...scriptEntries.map(([k, v]) => ({ name: k, command: v })),
    ...scripts,
  ];

  const runConfigsTyped = allScripts.slice(0, 10).map((s) => ({ name: s.name, command: typeof s.command === 'string' ? s.command : '' }));

  const healthStatus = pendingTasks.length > 3 ? 'needs-attention' : pendingTasks.length > 0 ? 'active' : 'healthy';

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-theme-icon/5 to-theme-surface border border-theme-border/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-theme-icon/10 flex items-center justify-center shrink-0">
            <FaFolder className="w-7 h-7 text-theme-icon" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-theme-text">{project.name}</h1>
              <span className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${
                healthStatus === 'healthy' ? 'text-green-400 bg-green-500/10' :
                healthStatus === 'needs-attention' ? 'text-yellow-400 bg-yellow-500/10' :
                'text-blue-400 bg-blue-500/10'
              }`}>
                <FaCircle className={`w-1.5 h-1.5 ${healthStatus === 'active' ? 'animate-pulse' : ''}`} />
                {healthStatus === 'healthy' ? 'Healthy' : healthStatus === 'needs-attention' ? 'Needs attention' : 'Active'}
              </span>
            </div>
            <p className="text-sm text-theme-text/50 mt-0.5">{project.description || 'No description'}</p>
            {techs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {techs.map((t: string) => <TechnologyBadge key={t} name={t} />)}
              </div>
            )}
            {Array.isArray(project.tags) && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {project.tags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-theme-icon/5 text-theme-text/40 rounded">
                    <FaTag className="w-2 h-2" />{t}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-theme-text/40">
              <span className="flex items-center gap-1"><FaCalendarAlt className="w-3 h-3" /> {new Date(project.created_at).toLocaleDateString()}</span>
              {gitInfo?.branch && <span className="flex items-center gap-1"><FaCodeBranch className="w-3 h-3 text-purple-400" /> {gitInfo.branch}</span>}
              {depsCount > 0 && <span className="flex items-center gap-1"><FaCube className="w-3 h-3 text-cyan-400" /> {depsCount} deps</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-theme-border/10">
          {project.local_path && (
            <>
              <button onClick={async () => { const r = await openFolder(project.local_path); if (r.success) toast.success(r.message); else toast.error(r.message); }} className="flex items-center gap-1.5 px-3 py-2 bg-theme-background border border-theme-border/20 rounded-xl text-xs text-theme-text/70 hover:text-theme-icon hover:border-theme-icon/30 transition-colors"><FaFolder className="w-3 h-3" /> Open Folder</button>
              <button onClick={async () => { const r = await openVSCode(project.local_path); if (r.success) toast.success(r.message); else toast.error(r.message); }} className="flex items-center gap-1.5 px-3 py-2 bg-theme-background border border-theme-border/20 rounded-xl text-xs text-theme-text/70 hover:text-theme-icon hover:border-theme-icon/30 transition-colors"><FaCode className="w-3 h-3" /> VS Code</button>
              <button onClick={async () => { const r = await openTerminal(project.local_path); if (r.success) toast.success(r.message); else toast.error(r.message); }} className="flex items-center gap-1.5 px-3 py-2 bg-theme-background border border-theme-border/20 rounded-xl text-xs text-theme-text/70 hover:text-theme-icon hover:border-theme-icon/30 transition-colors"><FaTerminal className="w-3 h-3" /> Terminal</button>
            </>
          )}
          {project.repository_url && (
            <button onClick={async () => { const r = await openBrowser(project.repository_url); if (r.success) toast.success(r.message); else toast.error(r.message); }} className="flex items-center gap-1.5 px-3 py-2 bg-theme-background border border-theme-border/20 rounded-xl text-xs text-theme-text/70 hover:text-theme-icon hover:border-theme-icon/30 transition-colors"><FaGithub className="w-3 h-3" /> Repository</button>
          )}
        </div>
      </div>

      {/* Onboarding checklist */}
      <OnboardingChecklist project={project} />

      {/* Health cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-theme-surface border border-theme-border/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-theme-text/40 mb-1">
            <FaTasks className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-lg font-bold text-theme-text">{pendingTasks.length}</p>
        </div>
        <div className="bg-theme-surface border border-theme-border/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-theme-text/40 mb-1">
            <FaExclamationTriangle className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-wider">Overdue</span>
          </div>
          <p className="text-lg font-bold text-red-400">{pendingTasks.filter((t: any) => t.due_date && new Date(t.due_date) < new Date()).length}</p>
        </div>
        <div className="bg-theme-surface border border-theme-border/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-theme-text/40 mb-1">
            <FaCodeBranch className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-wider">Branch</span>
          </div>
          <p className="text-lg font-bold text-theme-text truncate">{gitInfo?.branch || '-'}</p>
        </div>
        <div className="bg-theme-surface border border-theme-border/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-theme-text/40 mb-1">
            <FaShieldAlt className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-wider">Deps</span>
          </div>
          <p className="text-lg font-bold text-theme-text">{depsCount || 0}</p>
        </div>
      </div>

      {/* Scripts, Activity, Environment grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {allScripts.length > 0 && (
          <div className="bg-theme-surface border border-theme-border/20 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-theme-text mb-3 flex items-center gap-2"><FaPlay className="w-3.5 h-3.5 text-theme-icon" /> Scripts</h3>
            <div className="space-y-2">
              {allScripts.slice(0, 6).map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-theme-background/30 rounded-xl border border-theme-border/10">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-theme-text">{s.name}</p>
                    <p className="text-[10px] text-theme-text/40 font-mono truncate">{s.command}</p>
                  </div>
                  <button onClick={() => handleRunScript(s.command)} className="p-2 rounded-lg text-theme-text/30 hover:text-theme-icon hover:bg-theme-icon/10 transition-colors">
                    <FaPlay className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-theme-surface border border-theme-border/20 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-theme-text mb-3 flex items-center gap-2"><FaHistory className="w-3.5 h-3.5 text-theme-icon" /> Activity</h3>
          {activity.length === 0 ? (
            <p className="text-xs text-theme-text/30 text-center py-6">No activity yet</p>
          ) : (
            <div className="space-y-2">
              {activity.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-theme-background/20 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-theme-background/50 flex items-center justify-center text-theme-text/30">
                    <FaClock className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-theme-text/80 truncate">{a.title}</p>
                    <p className="text-[10px] text-theme-text/30">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {Object.keys(project.environment || {}).length > 0 && (
          <div className="bg-theme-surface border border-theme-border/20 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-theme-text mb-3">Environment</h3>
            <div className="space-y-1.5">
              {Object.entries(project.environment).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between p-2.5 bg-theme-background/30 rounded-lg">
                  <span className="text-xs font-mono text-theme-text/70">{k}</span>
                  <span className="text-xs font-mono text-theme-text/40">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Running Services */}
      {runConfigsTyped.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-theme-text flex items-center gap-2"><FaPlay className="w-3.5 h-3.5 text-green-400" /> Running Services</h3>
          <ServiceManager projectId={project.id} localPath={project.local_path} runConfigs={runConfigsTyped} />
        </div>
      )}
    </div>
  );
}
