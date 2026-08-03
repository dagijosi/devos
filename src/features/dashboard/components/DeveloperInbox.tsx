import { useState, useEffect } from 'react';
import { FaInbox, FaExclamationTriangle, FaBug, FaPlay, FaChevronRight, FaTelegram, FaCodeBranch, FaRocket } from 'react-icons/fa';
import { database } from '../../../database';
import { useNavigate } from 'react-router-dom';
import { TASKS, WORKFLOWS, TELEGRAM, PROJECT_TASKS } from '../../../routes/types/routeConstants';
import { UPDATES_KEY } from '../../utilities/telegramConfig';

interface InboxItem {
  id: string;
  type: 'overdue_task' | 'failed_deployment' | 'failed_workflow' | 'unread_telegram' | 'git_uncommitted';
  label: string;
  description: string;
  route?: string;
  severity: 'high' | 'medium' | 'low';
}

export function DeveloperInbox() {
  const navigate = useNavigate();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [overdueTasks, deployments, workflows] = await Promise.all([
          database.getOverdueProjectTasks().catch(() => []),
          database.getAllDeployments().catch(() => []),
          database.getWorkflows().catch(() => []),
        ]);

        const inbox: InboxItem[] = [];

        // Overdue tasks
        (overdueTasks || []).forEach((t: any) => {
          inbox.push({
            id: `task-${t.id}`,
            type: 'overdue_task',
            label: t.title,
            description: `Overdue · ${t.project_name || 'No project'}`,
            route: t.project_id ? PROJECT_TASKS.replace(':id', String(t.project_id)) : TASKS,
            severity: 'high',
          });
        });

        // Failed deployments
        (deployments || []).filter((d: any) => d.status === 'failed').forEach((d: any) => {
          inbox.push({
            id: `deploy-${d.id}`,
            type: 'failed_deployment',
            label: d.name || `Deployment #${d.id}`,
            description: 'Failed deployment',
            severity: 'high',
          });
        });

        // Failed workflows
        (workflows || []).filter((w: any) => w.last_run_status === 'failed').forEach((w: any) => {
          inbox.push({
            id: `wf-${w.id}`,
            type: 'failed_workflow',
            label: w.name || `Workflow #${w.id}`,
            description: 'Failed workflow run',
            route: WORKFLOWS,
            severity: 'medium',
          });
        });

        // Unread Telegram captures
        try {
          const updates = JSON.parse(localStorage.getItem(UPDATES_KEY) || '[]');
          const unprocessed = updates.filter((u: any) => !u.processed).length;
          if (unprocessed > 0) {
            inbox.push({
              id: 'telegram-unread',
              type: 'unread_telegram',
              label: `${unprocessed} unprocessed message${unprocessed > 1 ? 's' : ''}`,
              description: 'New Telegram captures waiting',
              route: TELEGRAM,
              severity: 'medium',
            });
          }
        } catch {}

        // Git uncommitted changes (from active project store)
        try {
          const { useActiveProjectStore } = await import('../../../stores/activeProject.store');
          const state = useActiveProjectStore.getState();
          if (state.activeProject?.branch) {
            inbox.push({
              id: 'git-changes',
              type: 'git_uncommitted',
              label: `Active branch: ${state.activeProject.branch}`,
              description: `${state.activeProject.name} — check for uncommitted changes`,
              severity: 'low',
            });
          }
        } catch {}

        setItems(inbox);
      } catch { setItems([]); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="bg-theme-surface border border-theme-border/20 rounded-2xl p-5">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-theme-border/10 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const severityIcon = (s: 'high' | 'medium' | 'low') => {
    switch (s) {
      case 'high': return <FaExclamationTriangle className="w-3 h-3 text-red-400" />;
      case 'medium': return <FaBug className="w-3 h-3 text-yellow-400" />;
      case 'low': return <FaChevronRight className="w-3 h-3 text-theme-text/30" />;
    }
  };

  const typeIcon = (t: InboxItem['type']) => {
    switch (t) {
      case 'overdue_task': return <FaExclamationTriangle className="w-3.5 h-3.5 text-red-400" />;
      case 'failed_deployment': return <FaRocket className="w-3.5 h-3.5 text-red-400" />;
      case 'failed_workflow': return <FaPlay className="w-3.5 h-3.5 text-yellow-400" />;
      case 'unread_telegram': return <FaTelegram className="w-3.5 h-3.5 text-blue-400" />;
      case 'git_uncommitted': return <FaCodeBranch className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  return (
    <div className="bg-theme-surface border border-theme-border/20 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-theme-border/10">
        <div className="flex items-center gap-2">
          <FaInbox className="w-4 h-4 text-theme-icon" />
          <h3 className="text-sm font-semibold text-theme-text">Inbox</h3>
          {items.length > 0 && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
              items.some(i => i.severity === 'high') ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
            }`}>
              {items.length}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <span className="text-[10px] text-theme-text/30">
            {items.filter(i => i.severity === 'high').length} critical
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center py-8 px-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-2">
            <FaInbox className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-theme-text/60">All clear</p>
          <p className="text-[11px] text-theme-text/30 mt-1">Nothing needs your attention right now</p>
        </div>
      ) : (
        <div className="divide-y divide-theme-border/5">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => item.route && navigate(item.route)}
              className={`w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-theme-background/20 transition-colors ${
                item.severity === 'high' ? 'bg-red-500/[0.02]' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-theme-background/50 flex items-center justify-center shrink-0">
                {typeIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-theme-text truncate">{item.label}</p>
                <p className="text-[10px] text-theme-text/40 mt-0.5">{item.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {severityIcon(item.severity)}
                {item.route && <FaChevronRight className="w-2.5 h-2.5 text-theme-text/20" />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
