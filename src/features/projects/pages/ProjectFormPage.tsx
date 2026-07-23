import { useNavigate } from 'react-router-dom';
import { PROJECTS } from '../../../routes/types/routeConstants';
import { ProjectWizard } from '../components/ProjectWizard';

export function ProjectFormPage() {
  const navigate = useNavigate();

  return (
    <div className="py-6">
      <ProjectWizard onClose={() => navigate(PROJECTS)} />
    </div>
  );
}
