import { useState, useEffect, useCallback } from 'react';
import { FaBell, FaPlus, FaTrash, FaToggleOn, FaToggleOff, FaExclamationTriangle, FaRocket, FaCheckCircle, FaCube, FaTasks, FaGitAlt } from 'react-icons/fa';
import { toast } from 'sonner';
import { database } from '../../database';
import { useSWR } from '../../hooks/useSWR';

const EVENT_TYPES = [
  { value: 'workflow_failed', label: 'Workflow Failed', icon: FaExclamationTriangle, color: 'text-red-400' },
  { value: 'deployment_failed', label: 'Deployment Failed', icon: FaRocket, color: 'text-red-400' },
  { value: 'deployment_success', label: 'Deployment Succeeded', icon: FaCheckCircle, color: 'text-green-400' },
  { value: 'dependency_vulnerable', label: 'Vulnerable Dependency', icon: FaCube, color: 'text-yellow-400' },
  { value: 'task_overdue', label: 'Task Overdue', icon: FaTasks, color: 'text-orange-400' },
  { value: 'task_due_soon', label: 'Task Due Soon', icon: FaTasks, color: 'text-blue-400' },
  { value: 'git_conflict', label: 'Git Conflict', icon: FaGitAlt, color: 'text-red-400' },
  { value: 'build_failed', label: 'Build Failed', icon: FaExclamationTriangle, color: 'text-red-400' },
  { value: 'service_crashed', label: 'Service Crashed', icon: FaExclamationTriangle, color: 'text-red-400' },
];

const ACTION_TYPES = [
  { value: 'toast', label: 'Toast Notification' },
  { value: 'notification', label: 'In-app Notification' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'email', label: 'Email' },
];

export function NotificationRules() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', event_type: 'workflow_failed', action_type: 'toast', action_config: '{}', condition: '{}' });

  const { data: rules, loading, refetch } = useSWR('notification-rules', () => database.getNotificationRules());

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    await database.createNotificationRule(form);
    setForm({ name: '', event_type: 'workflow_failed', action_type: 'toast', action_config: '{}', condition: '{}' });
    setShowForm(false);
    refetch();
    toast.success('Rule created');
  };

  const handleToggle = async (id: number) => {
    await database.toggleNotificationRule(id);
    refetch();
  };

  const handleDelete = async (id: number) => {
    await database.deleteNotificationRule(id);
    refetch();
    toast.success('Rule deleted');
  };

  const EventIcon = (type: string) => {
    const found = EVENT_TYPES.find(e => e.value === type);
    const Icon = found?.icon || FaBell;
    return <Icon className={`w-3.5 h-3.5 ${found?.color || 'text-theme-text/40'}`} />;
  };

  if (loading) return <div className="text-center py-8 text-xs text-theme-text/40">Loading notification rules...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-theme-text">Notification Rules</h3>
          <p className="text-xs text-theme-text/40 mt-0.5">Automated alerts for project events</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-theme-icon text-white rounded-xl hover:bg-theme-icon/90 transition-colors">
          <FaPlus className="w-3 h-3" /> {showForm ? 'Cancel' : 'Add Rule'}
        </button>
      </div>

      {showForm && (
        <div className="bg-theme-surface border border-theme-border/20 rounded-xl p-4 space-y-3">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Rule name" className="w-full bg-theme-background border border-theme-border/30 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50" />
          <div>
            <label className="text-[10px] font-medium text-theme-text/40 uppercase mb-1 block">Event</label>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_TYPES.map(et => (
                <button key={et.value} onClick={() => setForm(f => ({ ...f, event_type: et.value }))}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${form.event_type === et.value ? 'bg-theme-icon/10 text-theme-icon border border-theme-icon/20' : 'bg-theme-background text-theme-text/50 border border-theme-border/10 hover:text-theme-text'}`}>
                  <et.icon className="w-3 h-3" /> {et.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-medium text-theme-text/40 uppercase mb-1 block">Action</label>
            <div className="flex gap-1.5">
              {ACTION_TYPES.map(at => (
                <button key={at.value} onClick={() => setForm(f => ({ ...f, action_type: at.value }))}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${form.action_type === at.value ? 'bg-theme-icon/10 text-theme-icon border border-theme-icon/20' : 'bg-theme-background text-theme-text/50 border border-theme-border/10 hover:text-theme-text'}`}>
                  {at.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleAdd} disabled={!form.name.trim()}
            className="w-full py-2 text-xs font-medium bg-theme-icon text-white rounded-lg hover:bg-theme-icon/90 transition-colors disabled:opacity-50">
            Create Rule
          </button>
        </div>
      )}

      {(!rules || rules.length === 0) ? (
        <div className="text-center py-10 text-theme-text/30">
          <FaBell className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-xs">No notification rules configured</p>
          <p className="text-[10px] mt-0.5">Add rules to get alerts for failures, overdue tasks, and more</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule: any) => (
            <div key={rule.id} className="flex items-center gap-3 px-4 py-3 bg-theme-surface border border-theme-border/20 rounded-xl hover:border-theme-border/30 transition-colors">
              {EventIcon(rule.event_type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-theme-text truncate">{rule.name}</p>
                <p className="text-[10px] text-theme-text/40">{rule.event_type.replace(/_/g, ' ')} · {rule.action_type}</p>
              </div>
              <button onClick={() => handleToggle(rule.id)} className="p-1.5 rounded-lg hover:bg-theme-background/50 transition-colors" title={rule.enabled ? 'Disable' : 'Enable'}>
                {rule.enabled ? <FaToggleOn className="w-4 h-4 text-green-400" /> : <FaToggleOff className="w-4 h-4 text-theme-text/30" />}
              </button>
              <button onClick={() => handleDelete(rule.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-theme-text/30 hover:text-red-400 transition-colors">
                <FaTrash className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
