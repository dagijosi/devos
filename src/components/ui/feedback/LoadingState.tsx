import React from "react";
import { Package, type LucideIcon } from "lucide-react";

interface LoadingStateProps {
  title?: string;
  message?: string;
  icon?: LucideIcon;
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  title = "Loading...",
  message = "Please wait while we fetch the details.",
  icon: Icon = Package,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 min-h-[60vh] w-full bg-theme-background ${className}`}
    >
      <div className="text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-theme-border border-t-theme-icon rounded-full animate-spin mx-auto" />
          <Icon
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-theme-icon"
            size={24}
          />
        </div>

        <h3 className="text-lg font-semibold text-theme-text mb-2">{title}</h3>
        <p className="text-theme-text/60 text-sm">{message}</p>
      </div>
    </div>
  );
};

export default LoadingState;
