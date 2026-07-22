import React from 'react';
import { FaBars, FaChevronRight } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/app.store';
import { NotificationCenter } from '../../features/notifications/components/NotificationCenter';
import { ThemeSwitcher } from '../../theme-system';
import { DASHBOARD, PROJECTS, KNOWLEDGE, TOOLBOX, AUTOMATION, SETTING } from '../../routes/types/routeConstants';
import type { BreadcrumbItem } from '../ui';

interface TopbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const breadcrumbMap: Record<string, string> = {
  [DASHBOARD]: 'Dashboard',
  [PROJECTS]: 'Projects',
  [KNOWLEDGE]: 'Knowledge',
  [TOOLBOX]: 'Toolbox',
  [AUTOMATION]: 'Automation',
  [SETTING]: 'Settings',
};

const Topbar: React.FC<TopbarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const toggleCommandPalette = useAppStore((s) => s.toggleCommandPalette);

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathname = location.pathname;
    if (pathname === DASHBOARD || !breadcrumbMap[pathname]) {
      return [{ name: 'Dashboard', path: DASHBOARD }];
    }
    return [
      { name: 'Dashboard', path: DASHBOARD },
      { name: breadcrumbMap[pathname], path: pathname },
    ];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="flex items-center justify-between h-14 px-3 sm:px-6">
      <div className="flex items-center min-w-0 flex-1">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 group text-theme-text/70 hover:bg-theme-surface/50 hover:text-theme-icon shrink-0"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <FaBars className="w-4 h-4" />
        </button>

        <nav className="flex items-center space-x-1 text-sm min-w-0 flex-1 ml-2">
          {breadcrumbs.map((item, idx) => (
            <React.Fragment key={item.path}>
              {idx > 0 && (
                <FaChevronRight className="mx-1 sm:mx-2 text-theme-text/30 w-3 h-3 shrink-0" />
              )}
              <span
                onClick={() => navigate(item.path)}
                className={`transition-colors rounded px-1 py-0.5 ${
                  idx === breadcrumbs.length - 1
                    ? 'text-theme-text font-medium cursor-default'
                    : 'text-theme-text/60 hover:text-theme-icon cursor-pointer hover:bg-theme-surface/30'
                }`}
              >
                {item.name}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleCommandPalette}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-theme-text/60 bg-theme-surface/50 border border-theme-border/20 rounded-lg hover:border-theme-icon/30 hover:text-theme-icon transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <kbd className="px-1 py-0.5 bg-theme-background/50 rounded border border-theme-border/10 text-[10px]">Ctrl+K</kbd>
        </button>

        <ThemeSwitcher />
        <NotificationCenter />

        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer group px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl hover:bg-theme-surface/60 hover:shadow-lg transition-all duration-300 border border-theme-border/20 hover:border-theme-border/40 bg-theme-surface/20">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-theme-icon to-purple-500 overflow-hidden shrink-0 ring-2 ring-theme-border/30 group-hover:ring-theme-icon/50 transition-all duration-300 flex items-center justify-center">
              <span className="text-xs font-bold text-white">U</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-theme-background" />
          </div>
        </div>
      </div>
    </div>
  );
};

export { Topbar };
