import { useNavigate } from 'react-router-dom';
import { FaPlay, FaArrowRight, FaRocket } from 'react-icons/fa';
import { AUTOMATION } from '../../../../routes/types/routeConstants';

export function WorkflowsTab() {
  const navigate = useNavigate();
  return (
    <div className="text-center py-10">
      <FaRocket className="w-10 h-10 text-theme-text/20 mx-auto mb-3" />
      <h3 className="text-sm font-semibold text-theme-text">Automation & Workflows</h3>
      <p className="text-xs text-theme-text/40 mt-1 max-w-sm mx-auto">
        Attach workflows to this project for one-click development tasks.
      </p>
      <button
        onClick={() => navigate(AUTOMATION)}
        className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors"
      >
        <FaPlay className="w-3 h-3" /> Open Workflows
      </button>
    </div>
  );
}
