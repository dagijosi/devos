import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  SidebarHeader,
  SidebarNavigation,
  SidebarFooter,
} from '../ui/navigation';
import { MobileOverlay } from '../ui/overlays';
import { workspaceNavigationCategories, projectNavigationCategories } from '../../constants/navigation';
import { useActiveProjectStore } from '../../stores/activeProject.store';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, isMobile }) => {
  const location = useLocation();
  const params = useParams<{ id: string }>();
  const activeProject = useActiveProjectStore((s) => s.activeProject);

  // URL is the source of truth: /projects/:id/* → project hub mode
  const isProjectMode =
    /^\/projects\/[^/]+/.test(location.pathname) &&
    !location.pathname.startsWith('/projects/new') &&
    !/^\/projects\/[^/]+\/edit/.test(location.pathname);

  const categories = isProjectMode
    ? projectNavigationCategories(params.id!, activeProject?.name || 'Project', activeProject?.enabledModules)
    : workspaceNavigationCategories;

  return (
    <>
      <MobileOverlay
        isVisible={isOpen && isMobile}
        onClose={() => setIsOpen(false)}
      />

      <motion.div
        initial={false}
        animate={{
          width: isOpen ? 256 : 80,
          x: isMobile ? (isOpen ? 0 : -256) : 0,
        }}
        transition={{
          duration: isMobile ? 0.25 : 0.4,
          ease: [0.4, 0, 0.2, 1],
        }}
        className={`fixed top-0 left-0 h-dvh bg-theme-surface/95 backdrop-blur-md border-r border-theme-border/20 shadow-xl md:shadow-none print:hidden ${
          isMobile && isOpen ? 'z-60' : 'z-30'
        }`}
        style={{
          willChange: 'width, transform',
          transform: 'translateZ(0)',
        }}
      >
        <div className="flex flex-col h-full">
          <SidebarHeader
            isOpen={isOpen}
            isMobile={isMobile}
            onClose={() => setIsOpen(false)}
          />

          <SidebarNavigation
            isOpen={isOpen}
            isMobile={isMobile}
            onLinkClick={() => isMobile && setIsOpen(false)}
            categories={categories}
          />

          <SidebarFooter
            isOpen={isOpen}
            isMobile={isMobile}
            onLinkClick={() => isMobile && setIsOpen(false)}
          />
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;
