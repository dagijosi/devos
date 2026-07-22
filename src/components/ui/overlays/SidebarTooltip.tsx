import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarTooltipProps {
  content: string;
  children: React.ReactElement;
  show: boolean;
}

export const SidebarTooltip: React.FC<SidebarTooltipProps> = ({ content, children, show }) => {
  const triggerRef = useRef<HTMLElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (show && triggerRef.current) {
      const updatePosition = () => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
              top: rect.top + rect.height / 2 - 2, // Adjusted 2px up for better visual centering with icons
              left: rect.right + 10, // Slightly more space from sidebar
            });
        }
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [show]);

  return (
    <>
      {React.cloneElement(children as React.ReactElement<{ ref?: React.Ref<HTMLElement> }>, { ref: triggerRef })}
      {createPortal(
        <AnimatePresence>
          {show && (
            <motion.div
              initial={{ opacity: 0, x: -8, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -8, scale: 0.9 }}
              transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                transform: "translateY(-50%)",
              }}
              className="px-2.5 py-1.5 bg-theme-text text-theme-surface text-[12px] font-semibold rounded-md whitespace-nowrap shadow-2xl z-[9999] flex items-center pointer-events-none"
            >
              {/* Triangular Arrow */}
              <div 
                className="absolute right-[99%] top-1/2 -translate-y-1/2 w-0 h-0 
                border-y-[5px] border-y-transparent 
                border-r-[5px] border-r-theme-text" 
              />
              {content}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default SidebarTooltip;
