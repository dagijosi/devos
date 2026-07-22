import React from "react";
import { FaLayerGroup } from "react-icons/fa";

interface LogoProps {
  size?: number;
  useCurrentColor?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 40, useCurrentColor = false }) => {
  return (
    <div className="p-2 bg-theme-icon/10 rounded-xl shrink-0">
       <FaLayerGroup size={size * 0.6} className={useCurrentColor ? "" : "text-theme-icon"} />
    </div>
  );
};
