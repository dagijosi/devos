import { useState, useEffect } from 'react';
import { FaPlay, FaClock, FaFolder, FaCodeBranch, FaTerminal, FaToggleOn, FaToggleOff, FaCog } from 'react-icons/fa';
import { toast } from 'sonner';
import { database } from '../../database';
import type { Workflow } from './types';

interface Props {
  workflow: Workflow;
  onUpdate: () => void;
}

const TRIGGER_TYPES = [
  { value: 'manual', label: 'Manual', icon: FaPlay, description: 'Run manually from the UI' },
  { value: 'schedule', label: 'Scheduled', icon: FaClock, description: 'Run on a cron-like schedule' },
  { value: 'app_startup', label: 'App Startup', icon: FaCog, description: 'Run when DevOS starts' },
  { value: 'project_opened', label: 'Project Opened', icon: FaFolder, description: 'Run when the project is opened' },
  { value: 'file_change', label: 'File Change', icon: FaFolder, description: 'Run when files change in the project' },
  { value: 'git_event', label: 'Git Event', icon: FaCodeBranch, description: 'Run after git operations (commit/push/pull)' },
  { value: 'terminal_command', label: 'Terminal Command', icon: FaTerminal, description: 'Run when a terminal command completes' },
];

const SCHEDULE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const GIT_EVENTS = [
  { value: 'after_commit', label: 'After commit' },
  { value: 'after_push', label: 'After push' },
  { value: 'after_pull', label: 'After pull' },
  { value: 'on_conflict', label: 'On conflict' },
];

export function WorkflowTriggerEditor({ workflow, onUpdate }: Props) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [triggerType, setTriggerType] = useState('manual');
  const [enabled, setEnabled] = useState(true);
  const [scheduleType, setScheduleType] = useState('daily');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [gitEvent, setGitEvent] = useState('after_commit');
  const [filePattern, setFilePattern] = useState('**/*');
  const [terminalPattern, setTerminalPattern] = useState('');

  useEffect(() => {
    (async () => {
      const tc = await database.getWorkflowTriggerConfig(workflow.id);
      if (tc) {
        setConfig(tc);
        setTriggerType(tc.trigger_type);
        setEnabled(tc.enabled);
        try {
          const cfg = JSON.parse(tc.trigger_config || '{}');
          setScheduleType(cfg.scheduleType || 'daily');
          setScheduleTime(cfg.scheduleTime || '09:00');
          setGitEvent(cfg.gitEvent || 'after_commit');
          setFilePattern(cfg.filePattern || '**/*');
          setTerminalPattern(cfg.terminalPattern || '');
        } catch {}
      }
      setLoading(false);
    })();
  }, [workflow.id]);

  const saveConfig = async () => {
    const triggerConfig = JSON.stringify({
      scheduleType: triggerType === 'schedule' ? scheduleType : undefined,
      scheduleTime: triggerType === 'schedule' ? scheduleTime : undefined,
      gitEvent: triggerType === 'git_event' ? gitEvent : undefined,
      filePattern: triggerType === 'file_change' ? filePattern : undefined,
      terminalPattern: triggerType === 'terminal_command' ? terminalPattern : undefined,
    });
    await database.upsertWorkflowTriggerConfig(workflow.id, triggerType, triggerConfig);
    toast.success('Trigger saved');
    onUpdate();
  };

  if (loading) return <div className="text-xs text-theme-text/40 py-4 text-center">Loading trigger config...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-theme-text/60 uppercase tracking-wider flex items-center gap-1.5">
          <FaCog className="w-3 h-3" /> Trigger
        </h4>
        <button onClick={async () => { await database.toggleWorkflowTrigger(workflow.id); setEnabled(!enabled); }}
          className="flex items-center gap-1 text-xs transition-colors">
          {enabled ? <FaToggleOn className="w-4 h-4 text-green-400" /> : <FaToggleOff className="w-4 h-4 text-theme-text/30" />}
          {enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TRIGGER_TYPES.map(tt => {
          const Icon = tt.icon;
          const isActive = triggerType === tt.value;
          return (
            <button key={tt.value} onClick={() => setTriggerType(tt.value)}
              className={`flex flex-col items-start gap-1 p-2.5 rounded-lg text-xs transition-colors border flex-1 min-w-[120px] ${
                isActive ? 'bg-theme-icon/10 border-theme-icon/30 text-theme-icon' : 'bg-theme-background/30 border-theme-border/10 text-theme-text/50 hover:text-theme-text hover:border-theme-border/30'
              }`}>
              <div className="flex items-center gap-1.5">
                <Icon className="w-3 h-3" />
                <span className="font-medium">{tt.label}</span>
              </div>
              <span className="text-[9px] opacity-60">{tt.description}</span>
            </button>
          );
        })}
      </div>

      {/* Schedule config */}
      {triggerType === 'schedule' && (
        <div className="flex items-center gap-3 p-3 bg-theme-background/30 rounded-lg">
          <select value={scheduleType} onChange={e => setScheduleType(e.target.value)}
            className="bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-1.5 text-xs text-theme-text outline-none">
            {SCHEDULE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
            className="bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-1.5 text-xs text-theme-text outline-none" />
        </div>
      )}

      {/* Git event config */}
      {triggerType === 'git_event' && (
        <div className="p-3 bg-theme-background/30 rounded-lg">
          <select value={gitEvent} onChange={e => setGitEvent(e.target.value)}
            className="w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-1.5 text-xs text-theme-text outline-none">
            {GIT_EVENTS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>
      )}

      {/* File change config */}
      {triggerType === 'file_change' && (
        <div className="p-3 bg-theme-background/30 rounded-lg">
          <label className="text-[10px] font-medium text-theme-text/40 block mb-1">File pattern (glob)</label>
          <input value={filePattern} onChange={e => setFilePattern(e.target.value)} placeholder="**/*.ts" className="w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-1.5 text-xs font-mono text-theme-text outline-none focus:border-theme-icon/50" />
        </div>
      )}

      {/* Terminal command pattern */}
      {triggerType === 'terminal_command' && (
        <div className="p-3 bg-theme-background/30 rounded-lg">
          <label className="text-[10px] font-medium text-theme-text/40 block mb-1">Command pattern (e.g. 'npm run dev')</label>
          <input value={terminalPattern} onChange={e => setTerminalPattern(e.target.value)} placeholder="npm run dev" className="w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-1.5 text-xs font-mono text-theme-text outline-none focus:border-theme-icon/50" />
        </div>
      )}

      <button onClick={saveConfig}
        className="w-full py-2 text-xs font-medium bg-theme-icon text-white rounded-lg hover:bg-theme-icon/90 transition-colors">
        Save Trigger
      </button>
    </div>
  );
}
