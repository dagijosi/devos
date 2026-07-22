import React from 'react';
import { motion } from 'framer-motion';
import {
  SidebarHeader,
  SidebarNavigation,
  SidebarFooter,
} from '../ui/navigation';
import { MobileOverlay } from '../ui/overlays';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, isMobile }) => {
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
