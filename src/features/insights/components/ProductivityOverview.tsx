import { InsightWidget } from './InsightWidget';

interface Props {
  score: number;
  focusTime: number;
  projectsWorked: number;
  tasksCompleted: number;
  notesCreated: number;
  bugsSolved: number;
  commits: number;
}

export function ProductivityOverview({ score, focusTime, projectsWorked, tasksCompleted, notesCreated, bugsSolved, commits }: Props) {
  const hours = Math.floor(focusTime / 60);
  const mins = focusTime % 60;

  return (
    <InsightWidget title="Today's Summary" subtitle="Productivity Overview">
      <div className="flex flex-col items-center py-4">
        <span className="text-[10px] text-theme-text/40 uppercase tracking-wider">Productivity Score</span>
        <span className={`text-5xl font-bold mt-1 ${score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
          {score}%
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2 border-t border-theme-border/10 pt-4">
        <div className="text-center">
          <span className="text-lg font-bold text-theme-text">{hours}h {mins}m</span>
          <p className="text-[10px] text-theme-text/40">Focus Time</p>
        </div>
        <div className="text-center">
          <span className="text-lg font-bold text-theme-text">{projectsWorked}</span>
          <p className="text-[10px] text-theme-text/40">Projects</p>
        </div>
        <div className="text-center">
          <span className="text-lg font-bold text-theme-text">{tasksCompleted}</span>
          <p className="text-[10px] text-theme-text/40">Tasks Done</p>
        </div>
        <div className="text-center">
          <span className="text-lg font-bold text-theme-text">{notesCreated}</span>
          <p className="text-[10px] text-theme-text/40">Notes</p>
        </div>
        <div className="text-center">
          <span className="text-lg font-bold text-theme-text">{bugsSolved}</span>
          <p className="text-[10px] text-theme-text/40">Bugs Solved</p>
        </div>
        <div className="text-center">
          <span className="text-lg font-bold text-theme-text">{commits}</span>
          <p className="text-[10px] text-theme-text/40">Commits</p>
        </div>
      </div>
    </InsightWidget>
  );
}
