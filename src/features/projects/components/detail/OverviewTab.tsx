import { useEffect, useState } from 'react';
import { FaFolder, FaGithub, FaTerminal, FaCode, FaClock, FaHistory, FaCircle, FaPlay, FaCalendarAlt } from 'react-icons/fa';
import { toast } from 'sonner';
import { database } from '../../../../database';
import type { Project } from '../../types';
import { TechnologyBadge } from '../TechnologyBadge';
import { openFolder, openVSCode, openTerminal, openBrowser, runScript as runProjectScript } from '../../utils/projectActions';

interface OverviewTabProps {
  project: Project;
  onRefresh: () => void;
}

export function OverviewTab({ project, onRefresh: _onRefresh }: OverviewTabProps) {
  void _onRefresh;
  const [activity, setActivity] = useState<any[]>([]);
  const [scripts, setScripts] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [act, scr] = await Promise.all([
        database.getProjectActivity(project.id, 8),
        database.getProjectScripts(project.id),
      ]);
      setActivity(act || []);
      setScripts(scr || []);
    };
    load();
  }, [project.id]);

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

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-theme-icon/5 to-theme-surface border border-theme-border/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-theme-icon/10 flex items-center justify-center shrink-0">
            <FaFolder className="w-7 h-7 text-theme-icon" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-theme-text">{project.name}</h1>
            <p className="text-sm text-theme-text/50 mt-0.5">{project.description || 'No description'}</p>
            {techs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {techs.map((t: string) => <TechnologyBadge key={t} name={t} />)}
              </div>
            )}
            <div className="flex items-center gap-3 mt-3 text-xs text-theme-text/40">
              <span className="flex items-center gap-1"><FaCalendarAlt className="w-3 h-3" /> Started {new Date(project.created_at).toLocaleDateString()}</span>
              <span className={`flex items-center gap-1 ${project.status === 'active' ? 'text-green-400' : 'text-gray-400'}`}>
                <FaCircle className="w-2 h-2" /> {project.status}
              </span>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Scripts */}
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

        {/* Recent Activity */}
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

        {/* Environment */}
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
    </div>
  );
}
