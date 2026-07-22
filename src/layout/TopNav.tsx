import React from "react";
import { FaBars } from "react-icons/fa";
import { SETTING, DASHBOARD, PROFILE, USERS, ACTIVITY } from "../routes/types/routeConstants";
import { useLocation } from "react-router-dom";
import { NotificationDropdown, Breadcrumb } from "../components/ui";
import type { BreadcrumbItem } from "../components/ui";

interface TopNavProps {
  sidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}

const breadcrumbMap: Record<string, string> = {
  [DASHBOARD]: "Dashboard",
  [SETTING]: "Settings",
  [PROFILE]: "Profile",
  [USERS]: "Users",
  [ACTIVITY]: "Activity",
};

const TopNav: React.FC<TopNavProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathname = location.pathname;
    const crumbs: BreadcrumbItem[] = [];
    
    // Always start with Dashboard
    crumbs.push({ name: "Dashboard", path: DASHBOARD });

    // If not on Dashboard, add current page
    if (pathname !== DASHBOARD && breadcrumbMap[pathname]) {
      crumbs.push({ name: breadcrumbMap[pathname], path: pathname });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-transparent backdrop-blur-md border-b border-theme-border/10 transition-all duration-300">
      
      {/* Left Side: Menu/Toggle Button & Breadcrumb */}
      <div className="flex items-center">
        {/* Toggle button for all screen sizes */}
        <button
          className="text-theme-text/70 hover:text-theme-icon focus:outline-none mr-4 p-2 rounded-full hover:bg-theme-surface/50 transition-colors"
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <FaBars className="w-5 h-5" />
        </button>

        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbs} />
      </div>
      
      {/* Right Side: Notifications */}
      <div className="flex items-center">
        <NotificationDropdown />
      </div>
    </div>
  );
};

export default TopNav;