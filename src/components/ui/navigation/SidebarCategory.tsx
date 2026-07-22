import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarCategoryProps {
  name: string;
  isOpen: boolean;
  isMobile: boolean;
  categoryIndex: number;
  children: React.ReactNode;
}

export const SidebarCategory: React.FC<SidebarCategoryProps> = ({ 
  name, 
  isOpen, 
  isMobile, 
  categoryIndex, 
  children 
}) => {
  return (
    <div className="space-y-1">
      {/* Category Header */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: isMobile ? 0.15 : 0.3, 
              delay: isMobile ? 0 : categoryIndex * 0.05
            }}
            className="px-2 sm:px-3 py-1 overflow-hidden"
          >
            <span className="text-[12px] font-semibold text-theme-text/40 uppercase tracking-wider">
              {name}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Links */}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
};

