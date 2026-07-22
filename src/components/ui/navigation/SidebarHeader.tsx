import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { Logo } from "../Logo";
import { SidebarTooltip } from "../overlays/SidebarTooltip";

interface SidebarHeaderProps {
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ 
  isOpen, 
  isMobile, 
  onClose 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex items-center h-16 sm:h-20 border-b border-theme-border/50 relative px-4 overflow-hidden">
      <div className="flex items-center text-theme-icon h-full relative">
        {/* Logo Container - Stays left-aligned */}
        <SidebarTooltip content="DAGI" show={!isOpen && !isMobile && isHovered}>
          <motion.div 
            className={`shrink-0 text-theme-icon transition-all duration-500 z-10 ${!isOpen ? 'drop-shadow-[0_0_8px_rgba(var(--color-icon-rgb),0.4)]' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            animate={{ 
              scale: isOpen ? 1 : 1.1,
            }}
          >
            <Logo size={isOpen ? 32 : 38} useCurrentColor={true} />
          </motion.div>
        </SidebarTooltip>

        {/* Text Container - Slides behind the logo */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ 
                opacity: 0, 
                x: -40,
                transition: { duration: 0.3, ease: "easeIn" }
              }}
              transition={{ 
                duration: isMobile ? 0.2 : 0.4, 
                ease: [0.4, 0, 0.2, 1],
                delay: isMobile ? 0 : 0.1
              }}
              className="flex flex-col ml-3 overflow-hidden whitespace-nowrap"
            >
              <span className="text-base sm:text-lg font-bold tracking-tight text-theme-text">
                DAGI
              </span>
              <span className="text-[10px] font-bold text-theme-text/50 uppercase tracking-widest">
                The Best Template
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Close Button for Mobile */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="ml-auto text-theme-text/60 hover:text-theme-icon transition-colors relative z-10 p-2 rounded-lg hover:bg-theme-text/5"
            onClick={onClose}
            aria-label="Close menu"
          >
            <FaTimes className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SidebarHeader;
