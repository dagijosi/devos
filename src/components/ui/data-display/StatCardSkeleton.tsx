import React from "react";

const StatCardSkeleton: React.FC = () => {
  return (
    <div className="bg-theme-surface/70 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-theme-border/50 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-12 w-12 rounded-full bg-theme-border/50"></div>
      </div>
      <div>
        <div className="h-8 w-3/4 bg-theme-border/50 rounded-lg mb-2"></div>
        <div className="h-4 w-1/2 bg-theme-border/50 rounded-lg"></div>
      </div>
    </div>
  );
};

export default StatCardSkeleton;
