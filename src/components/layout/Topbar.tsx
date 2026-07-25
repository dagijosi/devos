import React from 'react';
import { FaBars, FaChevronRight } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/app.store';
import { NotificationCenter } from '../../features/notifications/components/NotificationCenter';
import { ThemeSwitcher } from '../../theme-system';
import { DASHBOARD, PROJECTS, PROJECT_DETAIL, PROJECT_FORM, PROJECT_EDIT, KNOWLEDGE, UTILITIES, WORKFLOWS, SETTING, AI, INSIGHTS, TELEGRAM, BACKUP, API_TYPE_GENERATOR, PROFILE } from '../../routes/types/routeConstants';

interface TopbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const breadcrumbMap: Record<string, string> = {
  [DASHBOARD]: 'Dashboard',
  [PROJECTS]: 'Projects',
  [KNOWLEDGE]: 'Library',
  [UTILITIES]: 'Utilities',
  [WORKFLOWS]: 'Workflows',
  [AI]: 'AI Assistant',
  [INSIGHTS]: 'Insights',
  [TELEGRAM]: 'Telegram',
  [BACKUP]: 'Backup',
  [API_TYPE_GENERATOR]: 'API Type Generator',
  [SETTING]: 'Settings',
  [PROFILE]: 'Profile',
};

const Topbar: React.FC<TopbarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const toggleCommandPalette = useAppStore((s) => s.toggleCommandPalette);

  const getBreadcrumbs = (): { name: string; path: string }[] => {
    const pathname = location.pathname;

    if (pathname === DASHBOARD) {
      return [{ name: 'Dashboard', path: DASHBOARD }];
    }

    if (pathname.startsWith(PROJECTS)) {
      const breadcrumbs = [{ name: 'Dashboard', path: DASHBOARD }, { name: 'Projects', path: PROJECTS }];

      if (pathname.startsWith(PROJECT_DETAIL)) {
        breadcrumbs.push({ name: 'Project Details', path: pathname });
      } else if (pathname.startsWith(PROJECT_FORM)) {
        breadcrumbs.push({ name: 'New Project', path: pathname });
      } else if (pathname.startsWith(PROJECT_EDIT)) {
        breadcrumbs.push({ name: 'Edit Project', path: pathname });
      }

      return breadcrumbs;
    }

    if (breadcrumbMap[pathname]) {
      return [
        { name: 'Dashboard', path: DASHBOARD },
        { name: breadcrumbMap[pathname], path: pathname },
      ];
    }

    const fallbackName = pathname === '/' ? 'Dashboard'
      : pathname.split('/').filter(Boolean).pop()?.replace(/[-_]/g, ' ') ?? 'Dashboard';
    return [
      { name: 'Dashboard', path: DASHBOARD },
      { name: fallbackName.replace(/\b\w/g, c => c.toUpperCase()), path: pathname },
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
      </div>
    </div>
  );
};

export { Topbar };
