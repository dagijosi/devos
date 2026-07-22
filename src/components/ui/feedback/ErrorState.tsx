import React from "react";
import { FaExclamationTriangle, FaRedo } from "react-icons/fa";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-theme-surface/50 rounded-lg">
      <FaExclamationTriangle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-xl font-bold text-theme-text mb-2">An Error Occurred</h3>
      <p className="text-theme-text/60 mb-6 max-w-md">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-500 text-white font-medium rounded-lg shadow-md hover:bg-red-600 transition-all flex items-center gap-2"
      >
        <FaRedo className="w-4 h-4" />
        <span>Retry</span>
      </button>
    </div>
  );
};

export default ErrorState;
