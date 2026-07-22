import React from "react";

interface LogoProps {
  size?: number;
  useCurrentColor?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 40, useCurrentColor = false }) => {
  const iconSize = Math.round(size * 0.5);
  const colorClass = useCurrentColor ? "" : "text-theme-icon";

  return (
    <div className="p-2 bg-theme-icon/10 rounded-xl shrink-0">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={colorClass}
      >
        <rect x="2" y="3" width="20" height="18" rx="2" ry="2" />
        <line x1="6" y1="9" x2="10" y2="12" />
        <line x1="6" y1="12" x2="10" y2="15" />
        <line x1="13" y1="15" x2="18" y2="15" />
      </svg>
    </div>
  );
};
