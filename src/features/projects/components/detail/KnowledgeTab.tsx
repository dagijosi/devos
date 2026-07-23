import { LibraryPage } from '../../../knowledge/pages/LibraryPage';

export function KnowledgeTab({ projectId }: { projectId: number }) {
  return <LibraryPage projectId={projectId} />;
}
