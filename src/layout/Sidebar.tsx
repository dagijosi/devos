import React from "react";
import { motion } from "framer-motion";
import {
  SidebarHeader,
  SidebarNavigation,
  SidebarFooter,
} from "../components/ui/navigation";
import { MobileOverlay } from "../components/ui/overlays";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobile: boolean;
  animate?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  setIsOpen,
  isMobile,
  animate = true,
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      <MobileOverlay
        isVisible={isOpen && isMobile}
        onClose={() => setIsOpen(false)}
      />

      {/* Sidebar Container */}
      <motion.div
        id="tour-sidebar"
        initial={false}
        animate={{
          width: isOpen ? 256 : 80,
          x: isMobile ? (isOpen ? 0 : -256) : 0,
        }}
        transition={{
          duration: animate ? (isMobile ? 0.25 : 0.4) : 0,
          ease: [0.4, 0, 0.2, 1],
        }}
        className={`fixed top-0 left-0 h-dvh bg-theme-surface/95 backdrop-blur-md border-r border-theme-border/20 shadow-xl md:shadow-none print:hidden ${
          isMobile && isOpen ? "z-60" : "z-30"
        }`}
        style={{
          willChange: "width, transform",
          transform: "translateZ(0)",
        }}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <SidebarHeader
            isOpen={isOpen}
            isMobile={isMobile}
            onClose={() => setIsOpen(false)}
          />

          {/* Navigation Links */}
          <SidebarNavigation
            isOpen={isOpen}
            isMobile={isMobile}
            onLinkClick={() => setIsOpen(false)}
          />

          {/* Sign Out Button */}
          <SidebarFooter
            isOpen={isOpen}
            isMobile={isMobile}
            onLinkClick={() => setIsOpen(false)}
          />
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;
