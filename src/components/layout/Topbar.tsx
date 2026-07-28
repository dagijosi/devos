import React from 'react';
import { FaBars, FaChevronRight, FaSearch } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/app.store';
import { ProjectSwitcher } from '../../features/projects/components/ProjectSwitcher';
import { NotificationCenter } from '../../features/notifications/components/NotificationCenter';
import { ThemeSwitcher } from '../../theme-system';
import { DASHBOARD, PROJECTS, PROJECT_DETAIL, KNOWLEDGE, UTILITIES, WORKFLOWS, SETTING, BACKUP, CLIPBOARD, SNIPPETS } from '../../routes/types/routeConstants';

interface TopbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const breadcrumbMap: Record<string, string> = {
  [DASHBOARD]: 'Dashboard',
  [PROJECTS]: 'Projects',
  [KNOWLEDGE]: 'Library',
  [UTILITIES]: 'Tools',
  [WORKFLOWS]: 'Workflows',
  [AI_ALT]: 'AI',
  [BACKUP]: 'Backup',
  [CLIPBOARD]: 'Clipboard',
  [SNIPPETS]: 'Snippets',
  [SETTING]: 'Settings',
};

const Topbar: React.FC<TopbarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const toggleCommandPalette = useAppStore((s) => s.toggleCommandPalette);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);

  const getBreadcrumbs = (): { name: string; path: string }[] => {
    const pathname = location.pathname;
    if (pathname === DASHBOARD) return [{ name: 'Dashboard', path: DASHBOARD }];

    if (pathname.startsWith(PROJECTS)) {
      const crumbs = [{ name: 'Projects', path: PROJECTS }];
      if (pathname.startsWith(PROJECT_DETAIL)) {
        crumbs.push({ name: 'Project', path: pathname });
      } else if (pathname.endsWith('/new')) {
        crumbs.push({ name: 'New Project', path: pathname });
      }
      return crumbs;
    }

    if (breadcrumbMap[pathname]) {
      return [{ name: breadcrumbMap[pathname], path: pathname }];
    }

    return [{ name: 'Dashboard', path: DASHBOARD }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="flex items-center justify-between h-14 px-3 sm:px-6 gap-2">
      <div className="flex items-center min-w-0 flex-1 gap-2">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 group text-theme-text/70 hover:bg-theme-surface/50 hover:text-theme-icon shrink-0"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <FaBars className="w-4 h-4" />
        </button>

        <div className="hidden sm:block">
          <ProjectSwitcher />
        </div>

        <nav className="flex items-center space-x-1 text-sm min-w-0">
          {breadcrumbs.map((item, idx) => (
            <React.Fragment key={item.path}>
              {idx > 0 && (
                <FaChevronRight className="mx-1 text-theme-text/30 w-3 h-3 shrink-0" />
              )}
              <span
                onClick={() => navigate(item.path)}
                className={`transition-colors rounded px-1 py-0.5 truncate ${
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

      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-theme-text/60 bg-theme-surface/50 border border-theme-border/20 rounded-lg hover:border-theme-icon/30 hover:text-theme-icon transition-colors"
          title="Search & Commands (Ctrl+K)"
        >
          <FaSearch className="w-3 h-3" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline px-1 py-0.5 bg-theme-background/50 rounded border border-theme-border/10 text-[10px]">Ctrl+K</kbd>
        </button>

        <ThemeSwitcher />
        <NotificationCenter />
      </div>
    </div>
  );
};

export { Topbar };
