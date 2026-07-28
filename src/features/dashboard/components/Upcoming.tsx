import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaRegCircle, FaTasks } from 'react-icons/fa';
import { database } from '../../../database';
import { PROJECTS } from '../../../routes/types/routeConstants';

interface Task {
  id: number;
  project_id: number;
  title: string;
  status: string;
  due_date: string | null;
}

export function Upcoming() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectNames, setProjectNames] = useState<Record<number, string>>({});

  useEffect(() => {
    const load = async () => {
      const [allTasks, projects] = await Promise.all([database.getAllProjectTasks(), database.getProjects()]);
      setTasks(allTasks.filter(task => task.status !== 'done').slice(0, 6));
      setProjectNames(Object.fromEntries(projects.map(project => [project.id, project.name])));
    };
    void load();
  }, []);

  const complete = async (task: Task) => {
    await database.updateProjectTask(task.id, { ...task, description: '', priority: 'medium', status: 'done' });
    setTasks(current => current.filter(item => item.id !== task.id));
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-6">
        <FaTasks className="w-7 h-7 text-theme-text/20 mx-auto mb-2" />
        <p className="text-xs text-theme-text/40">No open project tasks</p>
        <button onClick={() => navigate(PROJECTS)} className="mt-2 text-xs text-theme-icon hover:text-theme-icon/80">Open projects</button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tasks.map(task => (
        <button key={task.id} onClick={() => complete(task)} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-theme-background/20 transition-colors text-left group">
          <FaRegCircle className="w-4 h-4 text-theme-text/30 group-hover:text-theme-icon shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="block text-sm text-theme-text truncate">{task.title}</span>
            <span className="block text-[10px] text-theme-text/30 truncate">{projectNames[task.project_id] || 'Project'}{task.due_date ? ` · Due ${task.due_date}` : ''}</span>
          </span>
          <FaCheckCircle className="w-3 h-3 text-theme-text/10 group-hover:text-green-400" />
        </button>
      ))}
    </div>
  );
}
