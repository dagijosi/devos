import { useState, useEffect, useCallback } from 'react';
import { database } from '../../database';

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  due_date: string | null;
  created_at: string;
  project_name?: string;
  project_color?: string;
  project_path?: string;
}

export function useTasks(view: 'all' | 'today' | 'overdue' | 'pending' = 'all') {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let result: Task[];
      if (view === 'today') result = await database.getTodayProjectTasks();
      else if (view === 'overdue') result = await database.getOverdueProjectTasks();
      else if (view === 'pending') result = await database.getPendingProjectTasks();
      else result = await database.getAllProjectTasks();
      setTasks(result || []);
    } catch { setTasks([]); }
    setLoading(false);
  }, [view]);

  useEffect(() => { load(); }, [load]);

  const addTask = async (projectId: number, title: string, priority = 'medium', dueDate?: string) => {
    await database.addProjectTask(projectId, title, priority, dueDate);
    await load();
  };

  const updateTask = async (id: number, data: Partial<Task>) => {
    await database.updateProjectTask(id, data);
    await load();
  };

  const deleteTask = async (id: number) => {
    await database.deleteProjectTask(id);
    await load();
  };

  return { tasks, loading, addTask, updateTask, deleteTask, refresh: load };
}
