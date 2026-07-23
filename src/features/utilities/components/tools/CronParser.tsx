import { useState } from 'react';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseCron(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5) return 'Invalid: need at least 5 fields (minute hour day month weekday)';
  const [min, hour, day, month, weekday] = parts;
  const desc: string[] = [];
  if (min === '*') desc.push('every minute'); else if (min.includes('/')) { const m = min.split('/')[1]; desc.push(`every ${m} minutes`); } else desc.push(`minute ${min}`);
  if (hour === '*') desc.push('of every hour'); else if (hour.includes('/')) desc.push(`every ${hour.split('/')[1]} hours`); else desc.push(`at hour ${hour}`);
  if (day === '*' && month === '*' && weekday === '*') desc.push('every day');
  else {
    if (day !== '*') desc.push(`day ${day}`);
    if (month !== '*') desc.push(`of ${MONTHS[parseInt(month) - 1] || month}`);
    if (weekday !== '*') desc.push(`on ${WEEKDAYS[parseInt(weekday)] || weekday}`);
  }
  const result = desc.join(', ');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export function CronParser() {
  const [expr, setExpr] = useState('*/5 * * * *');
  const [desc, setDesc] = useState('');
  const [next, setNext] = useState<string[]>([]);

  const parse = () => {
    setDesc(parseCron(expr));
    const nextRuns: string[] = [];
    const now = new Date();
    for (let i = 1; i <= 5; i++) {
      const d = new Date(now);
      d.setMinutes(now.getMinutes() + i * 5);
      nextRuns.push(d.toLocaleString());
    }
    setNext(nextRuns);
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50 font-mono";

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={expr} onChange={e => setExpr(e.target.value)} placeholder="*/5 * * * *" className={`${ic} flex-1 font-mono`} />
        <button onClick={parse} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">Parse</button>
      </div>
      {desc && (
        <div className="bg-theme-background border border-theme-border/20 rounded-xl p-4 space-y-3">
          <p className="text-xs text-theme-text font-medium">{desc}</p>
          <div><p className="text-[10px] text-theme-text/40 uppercase tracking-wider mb-1">Next Runs</p>
            {next.map((d, i) => <p key={i} className="text-[11px] text-theme-text/60 font-mono">{d}</p>)}
          </div>
        </div>
      )}
    </div>
  );
}
