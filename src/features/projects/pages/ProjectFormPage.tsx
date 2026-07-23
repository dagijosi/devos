import { useNavigate, useLocation } from 'react-router-dom';
import { PROJECTS } from '../../../routes/types/routeConstants';
import { ProjectWizard } from '../components/ProjectWizard';
import type { ProjectFormData } from '../types';

export function ProjectFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialData = location.state as Partial<ProjectFormData> | undefined;

  return (
    <div className="py-6">
      <ProjectWizard onClose={() => navigate(PROJECTS)} initialData={initialData} />
    </div>
  );
}
