import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import type { NavLink } from "../../../constants/navigation";

interface SidebarFlyoutProps {
  link: NavLink;
  children: React.ReactElement;
  show: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

export const SidebarFlyout: React.FC<SidebarFlyoutProps> = ({ 
  link, 
  children, 
  show,
  onMouseEnter,
  onMouseLeave,
  onClick
}) => {
  const location = useLocation();
  const triggerRef = useRef<HTMLElement>(null);
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });
  const [isFlyoutHovered, setIsFlyoutHovered] = useState(false);

  useEffect(() => {
    if (show && triggerRef.current) {
      const updatePosition = () => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const flyoutHeight = link.children ? link.children.length * 40 + 80 : 200;
          
          const hasSpaceBelow = rect.top + flyoutHeight < viewportHeight;

          if (hasSpaceBelow) {
            setCoords({
              top: rect.top,
              left: rect.right + 12,
            });
          } else {
            setCoords({
              bottom: viewportHeight - rect.bottom,
              left: rect.right + 12,
            });
          }
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
  }, [show, link.children]);

  const isVisible = show || isFlyoutHovered;

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={() => onMouseEnter()}
        onMouseLeave={() => onMouseLeave()}
        className="contents"
      >
        {children}
      </span>
      {createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, x: -10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              style={{
                position: "fixed",
                top: coords.top,
                bottom: coords.bottom,
                left: coords.left,
                zIndex: 9999,
              }}
              onMouseEnter={() => setIsFlyoutHovered(true)}
              onMouseLeave={() => {
                setIsFlyoutHovered(false);
                onMouseLeave();
              }}
              className="min-w-[220px] bg-theme-surface border border-theme-border/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl bg-theme-surface/90"
            >
              {/* Premium Header - Matching Footer Style */}
              <div className="relative overflow-hidden px-4 py-3 bg-gradient-to-br from-theme-icon/15 via-theme-icon/5 to-transparent border-b border-theme-border/30">
                 {/* Decorative background element */}
                 <div className="absolute -right-2 -top-2 w-12 h-12 bg-theme-icon/10 rounded-full blur-xl" />
                
                <div className="flex items-center gap-2.5 relative z-10">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-theme-icon/20 text-theme-icon flex items-center justify-center border border-theme-icon/30">
                    {link.icon && <link.icon size={16} />}
                  </div>
                  <span className="text-xs font-bold text-theme-text uppercase tracking-[0.15em] opacity-90">
                    {link.name}
                  </span>
                </div>
              </div>

              {/* Child Links */}
              <div className="p-2 space-y-1">
                {link.children?.map((child) => {
                  const isActive = child.href && location.pathname === child.href;
                  return (
                    <Link
                      key={child.name}
                      to={child.href || "#"}
                      onClick={onClick}
                      className={`flex items-center h-10 px-3 rounded-xl text-sm transition-all duration-300 font-medium group ${
                        isActive 
                          ? "bg-theme-icon/10 text-theme-icon shadow-sm" 
                          : "text-theme-text/70 hover:bg-theme-text/5 hover:text-theme-icon"
                      }`}
                    >
                      <div className={`flex items-center justify-center w-7 h-7 rounded-lg mr-2 transition-colors ${isActive ? 'bg-theme-icon/10' : 'group-hover:bg-theme-icon/5'}`}>
                        {child.icon && <child.icon className={`w-3.5 h-3.5 ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`} />}
                      </div>
                      {child.name}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default SidebarFlyout;
