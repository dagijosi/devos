import { useNavigate } from 'react-router-dom';
import { FaStickyNote, FaCode, FaBug, FaArrowRight } from 'react-icons/fa';
import { KNOWLEDGE } from '../../../../routes/types/routeConstants';

export function KnowledgeTab({ projectId }: { projectId: number }) {
  const navigate = useNavigate();

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Notes', icon: FaStickyNote, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Snippets', icon: FaCode, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Bugs', icon: FaBug, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map(item => (
          <div key={item.label} className={`${item.bg} rounded-2xl p-5 text-center cursor-pointer hover:opacity-80 transition-opacity`}
            onClick={() => navigate(KNOWLEDGE)}>
            <item.icon className={`w-6 h-6 ${item.color} mx-auto mb-2`} />
            <p className="text-xs text-theme-text/40">{item.label}</p>
            <p className="text-[10px] text-theme-text/30 mt-1">View all</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate(KNOWLEDGE)}
        className="flex items-center justify-center gap-2 w-full py-3 bg-theme-surface border border-theme-border/20 rounded-xl text-sm text-theme-text/60 hover:text-theme-icon hover:border-theme-icon/30 transition-all"
      >
        Open Knowledge Base <FaArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}
