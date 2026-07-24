import { useState } from 'react';
import { FaCheckCircle, FaRegCircle, FaPlus, FaTasks } from 'react-icons/fa';

interface Goal {
  id: string;
  text: string;
  done: boolean;
}

export function Upcoming() {
  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const saved = localStorage.getItem('devos_dashboard_goals');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');

  const toggle = (id: string) => {
    const next = goals.map(g => g.id === id ? { ...g, done: !g.done } : g);
    setGoals(next);
    localStorage.setItem('devos_dashboard_goals', JSON.stringify(next));
  };

  const add = () => {
    if (!newText.trim()) return;
    const next = [...goals, { id: crypto.randomUUID(), text: newText.trim(), done: false }];
    setGoals(next);
    localStorage.setItem('devos_dashboard_goals', JSON.stringify(next));
    setNewText('');
    setAdding(false);
  };

  const done = goals.filter(g => g.done).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-theme-text/40">
          <FaTasks className="w-3 h-3" />
          <span>{done}/{goals.length} complete</span>
        </div>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-xs text-theme-icon hover:text-theme-icon/80 transition-colors">
          <FaPlus className="w-2.5 h-2.5" /> Add
        </button>
      </div>

      {adding && (
        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') add(); if (e.key === 'Escape') setAdding(false); }}
            placeholder="What do you want to accomplish?"
            className="flex-1 bg-theme-background border border-theme-border/30 rounded-lg px-3 py-2 text-xs text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50"
            autoFocus
          />
          <button onClick={add} className="px-3 py-2 bg-theme-icon text-white rounded-lg text-xs font-medium hover:bg-theme-icon/90">Add</button>
        </div>
      )}

      <div className="space-y-1">
        {goals.map(g => (
          <div key={g.id}
            onClick={() => toggle(g.id)}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-theme-background/20 transition-colors cursor-pointer group"
          >
            {g.done ? (
              <FaCheckCircle className="w-4 h-4 text-green-400 shrink-0" />
            ) : (
              <FaRegCircle className="w-4 h-4 text-theme-text/30 group-hover:text-theme-text/50 shrink-0" />
            )}
            <span className={`text-sm ${g.done ? 'line-through text-theme-text/30' : 'text-theme-text'}`}>{g.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
