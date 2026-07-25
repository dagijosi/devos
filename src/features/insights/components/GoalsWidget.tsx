import { useState } from 'react';
import { FaPlus, FaTrash, FaCheck } from 'react-icons/fa';
import { toast } from 'sonner';
import { InsightWidget, ProgressBar } from './InsightWidget';
import { database } from '../../../database';
import type { Goal } from '../types';

interface Props {
  goals: Goal[];
  onRefresh: () => void;
}

export function GoalsWidget({ goals, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState(10);
  const [deadline, setDeadline] = useState('');

  const active = goals.filter((g) => g.status === 'active');
  const completed = goals.filter((g) => g.status === 'completed');

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      await database.createGoal({
        title: title.trim(),
        target,
        deadline: deadline || undefined,
      });
      toast.success('Goal created');
      setTitle('');
      setTarget(10);
      setDeadline('');
      setShowForm(false);
      onRefresh();
    } catch {
      toast.error('Failed to create goal');
    }
  };

  const handleToggle = async (goal: Goal) => {
    try {
      await database.updateGoal(goal.id, {
        status: goal.status === 'completed' ? 'active' : 'completed',
      });
      onRefresh();
    } catch {
      toast.error('Failed to update goal');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await database.deleteGoal(id);
      toast.success('Goal deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete goal');
    }
  };

  return (
    <InsightWidget
      title="Goals"
      subtitle={`${active.length} active, ${completed.length} completed`}
      action={
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-[11px] text-theme-icon/60 hover:text-theme-icon transition-colors"
        >
          <FaPlus className="w-3 h-3" /> {showForm ? 'Cancel' : 'Add Goal'}
        </button>
      }
    >
      {/* Inline creation form */}
      {showForm && (
        <div className="mb-4 p-3 bg-theme-background/50 rounded-xl border border-theme-border/20 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Goal title..."
            className="w-full px-3 py-2 bg-theme-surface border border-theme-border/30 rounded-lg text-xs text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50"
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-theme-text/40 block mb-1">Target (units)</label>
              <input
                type="number"
                min={1}
                value={target}
                onChange={(e) => setTarget(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-theme-surface border border-theme-border/30 rounded-lg text-xs text-theme-text outline-none focus:border-theme-icon/50"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-theme-text/40 block mb-1">Deadline (optional)</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-theme-surface border border-theme-border/30 rounded-lg text-xs text-theme-text outline-none focus:border-theme-icon/50"
              />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="w-full px-3 py-2 text-xs font-medium text-white bg-theme-icon rounded-lg hover:bg-theme-icon/90 transition-colors disabled:opacity-50"
          >
            Create Goal
          </button>
        </div>
      )}

      {/* Active goals */}
      <div className="space-y-3">
        {active.length === 0 && !showForm && (
          <p className="text-xs text-theme-text/40 text-center py-4">
            No active goals. Click &quot;Add Goal&quot; to set one.
          </p>
        )}
        {active.map((g) => (
          <div key={g.id} className="group space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => handleToggle(g)}
                  className="w-4 h-4 rounded border border-theme-border/30 flex items-center justify-center hover:border-emerald-400/50 transition-colors shrink-0"
                  title="Mark complete"
                >
                  {g.progress >= g.target && <FaCheck className="w-2.5 h-2.5 text-emerald-400" />}
                </button>
                <span className="text-theme-text/70 truncate">{g.title}</span>
                {g.deadline && (
                  <span className="text-[9px] text-theme-text/30 shrink-0">
                    due {new Date(g.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-theme-text font-medium">
                  {g.progress}/{g.target}
                </span>
                <button
                  onClick={() => handleDelete(g.id)}
                  className="opacity-0 group-hover:opacity-100 text-theme-text/30 hover:text-red-400 transition-all"
                  title="Delete goal"
                >
                  <FaTrash className="w-3 h-3" />
                </button>
              </div>
            </div>
            <ProgressBar value={g.progress} max={g.target} color={g.progress >= g.target ? 'bg-emerald-400' : 'bg-theme-icon'} />
          </div>
        ))}
      </div>

      {/* Completed goals */}
      {completed.length > 0 && (
        <details className="mt-4">
          <summary className="text-[11px] text-theme-text/30 cursor-pointer hover:text-theme-text/50 transition-colors">
            {completed.length} completed
          </summary>
          <div className="mt-2 space-y-2">
            {completed.map((g) => (
              <div key={g.id} className="flex items-center justify-between text-xs text-theme-text/40">
                <div className="flex items-center gap-2">
                  <FaCheck className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="line-through">{g.title}</span>
                </div>
                <button
                  onClick={() => handleDelete(g.id)}
                  className="text-theme-text/20 hover:text-red-400 transition-colors"
                >
                  <FaTrash className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </InsightWidget>
  );
}
