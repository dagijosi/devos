import { useState, useEffect } from 'react';
import { FaPlus, FaCheckCircle, FaRegCircle, FaTrash, FaExclamationCircle, FaLink } from 'react-icons/fa';
import { database } from '../../../../database';
import { TaskLinks } from '../../../tasks/TaskLinks';

interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date: string | null;
  created_at: string;
}

export function TasksTab({ projectId }: { projectId: number }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [expandedLinks, setExpandedLinks] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const t = await database.getProjectTasks(projectId);
      setTasks(t || []);
      setLoading(false);
    };
    load();
  }, [projectId]);

  const addTask = async () => {
    if (!newTitle.trim()) return;
    await database.addProjectTask(projectId, newTitle.trim());
    const t = await database.getProjectTasks(projectId);
    setTasks(t || []);
    setNewTitle('');
    setAdding(false);
  };

  const toggleTask = async (task: Task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    await database.updateProjectTask(task.id, { ...task, status: nextStatus });
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
  };

  const deleteTask = async (id: number) => {
    await database.deleteProjectTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const priorityColors: Record<string, string> = {
    high: 'text-red-400',
    medium: 'text-yellow-400',
    low: 'text-blue-400',
  };

  if (loading) {
    return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-theme-border/10 rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-theme-text/40">{tasks.filter(t => t.status === 'done').length}/{tasks.length} complete</p>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-xs text-theme-icon hover:text-theme-icon/80 transition-colors">
          <FaPlus className="w-2.5 h-2.5" /> Add Task
        </button>
      </div>

      {adding && (
        <div className="flex items-center gap-2 mb-4">
          <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') setAdding(false); }}
            placeholder="What needs to be done?" autoFocus
            className="flex-1 bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
          <button onClick={addTask} className="px-4 py-2.5 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90">Add</button>
        </div>
      )}

      {tasks.length === 0 && !adding && (
        <div className="text-center py-8">
          <p className="text-xs text-theme-text/30">No tasks yet</p>
        </div>
      )}

      <div className="space-y-1">
        {tasks.map(task => (
          <div key={task.id}>
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-theme-background/20 transition-colors group">
              <button onClick={() => toggleTask(task)} className="shrink-0">
                {task.status === 'done' ? <FaCheckCircle className="w-4 h-4 text-green-400" /> : <FaRegCircle className="w-4 h-4 text-theme-text/30 group-hover:text-theme-text/50" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${task.status === 'done' ? 'line-through text-theme-text/30' : 'text-theme-text'}`}>{task.title}</p>
                {task.description && <p className="text-xs text-theme-text/40 truncate">{task.description}</p>}
              </div>
              <FaExclamationCircle className={`w-3 h-3 ${priorityColors[task.priority] || 'text-theme-text/20'}`} />
              <button onClick={() => setExpandedLinks(expandedLinks === task.id ? null : task.id)} className="p-1 rounded text-theme-text/20 hover:text-theme-icon opacity-0 group-hover:opacity-100 transition-all" title="Links">
                <FaLink className="w-3 h-3" />
              </button>
              <button onClick={() => deleteTask(task.id)} className="p-1 rounded text-theme-text/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                <FaTrash className="w-3 h-3" />
              </button>
            </div>
            {expandedLinks === task.id && (
              <div className="px-3 pb-2">
                <TaskLinks taskId={task.id} projectId={projectId} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
