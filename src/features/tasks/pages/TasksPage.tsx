import { useState, useMemo } from 'react';
import { FaTasks, FaCalendarDay, FaExclamationTriangle, FaPlus, FaFilter } from 'react-icons/fa';
import { useTasks } from '../useTasks';
import { QuickCapture } from '../../quick-capture/QuickCapture';
import { useProjects } from '../../projects/hooks/useProjects';

type View = 'today' | 'overdue' | 'pending' | 'all';

const VIEWS: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'today', label: 'Today', icon: FaCalendarDay },
  { id: 'overdue', label: 'Overdue', icon: FaExclamationTriangle },
  { id: 'pending', label: 'This Week', icon: FaFilter },
  { id: 'all', label: 'All Tasks', icon: FaTasks },
];

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-400 bg-red-500/10',
  medium: 'text-yellow-400 bg-yellow-500/10',
  low: 'text-green-400 bg-green-500/10',
};

export function TasksPage() {
  const [view, setView] = useState<View>('today');
  const { tasks, loading, addTask: _, updateTask, deleteTask } = useTasks(view);
  const { projects = [] } = useProjects();
  const [captureOpen, setCaptureOpen] = useState(false);
  const [filterProject, setFilterProject] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!filterProject) return tasks;
    return tasks.filter((t) => t.project_id === filterProject);
  }, [tasks, filterProject]);

  const counts = useMemo(() => {
    return {
      today: tasks.filter((t) => t.status !== 'done').length,
      overdue: tasks.filter((t) => t.status !== 'done').length,
      total: tasks.length,
    };
  }, [tasks]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-theme-border/10 rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-theme-surface border border-theme-border/20 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FaTasks className="w-5 h-5 text-theme-icon" />
          <h1 className="text-lg font-bold text-theme-text">Tasks</h1>
          {counts.overdue > 0 && view === 'overdue' && (
            <span className="px-2 py-0.5 text-[10px] font-medium text-red-400 bg-red-500/10 rounded">{counts.overdue} overdue</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterProject || ''}
            onChange={(e) => setFilterProject(e.target.value ? Number(e.target.value) : null)}
            className="bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-1.5 text-xs text-theme-text outline-none focus:border-theme-icon/40"
          >
            <option value="">All projects</option>
            {projects.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={() => setCaptureOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-theme-icon text-white rounded-lg hover:bg-theme-icon/90 transition-colors"
          >
            <FaPlus className="w-3 h-3" /> Add Task
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-theme-border/10">
        {VIEWS.map((v) => {
          const Icon = v.icon;
          return (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all ${
                view === v.id
                  ? 'text-theme-icon border-theme-icon'
                  : 'text-theme-text/40 border-transparent hover:text-theme-text/70 hover:border-theme-text/20'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {v.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <FaTasks className="w-12 h-12 text-theme-text/10 mx-auto mb-3" />
          <p className="text-sm text-theme-text/40">
            {view === 'today' ? 'No tasks for today' : view === 'overdue' ? 'Nothing overdue' : view === 'pending' ? 'No pending tasks this week' : 'No tasks yet'}
          </p>
          <button onClick={() => setCaptureOpen(true)} className="mt-3 px-4 py-2 text-xs font-medium bg-theme-icon text-white rounded-lg hover:bg-theme-icon/90 transition-colors">
            Create your first task
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-3 px-4 py-3 bg-theme-surface border border-theme-border/20 rounded-xl transition-all hover:border-theme-border/40 ${
                task.status === 'done' ? 'opacity-50' : ''
              }`}
            >
              <button
                onClick={() => updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' } as any)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  task.status === 'done'
                    ? 'bg-green-500 border-green-500'
                    : 'border-theme-text/30 hover:border-theme-icon'
                }`}
              >
                {task.status === 'done' && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-theme-text/40' : 'text-theme-text'}`}>
                    {task.title}
                  </p>
                  <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${PRIORITY_COLORS[task.priority] || ''}`}>
                    {task.priority}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {task.project_name && (
                    <span className="text-[10px] text-theme-text/40 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.project_color || '#6366f1' }} />
                      {task.project_name}
                    </span>
                  )}
                  {task.due_date && (
                    <span className="text-[10px] text-theme-text/30">{new Date(task.due_date).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <select
                  value={task.status}
                  onChange={(e) => updateTask(task.id, { status: e.target.value } as any)}
                  className="bg-theme-background/50 border border-theme-border/20 rounded px-2 py-1 text-[10px] text-theme-text outline-none"
                >
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1.5 rounded text-theme-text/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete task"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {captureOpen && <QuickCapture onClose={() => setCaptureOpen(false)} onCreated={() => { setCaptureOpen(false); }} />}
    </div>
  );
}
