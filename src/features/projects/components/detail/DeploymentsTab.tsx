import { FaCloudUploadAlt } from 'react-icons/fa';

export function DeploymentsTab() {
  return (
    <div className="text-center py-10">
      <FaCloudUploadAlt className="w-10 h-10 text-theme-text/20 mx-auto mb-3" />
      <h3 className="text-sm font-semibold text-theme-text">Deployments</h3>
      <p className="text-xs text-theme-text/40 mt-1 max-w-sm mx-auto">
        Deployments will be available in a future update.
      </p>
    </div>
  );
}
