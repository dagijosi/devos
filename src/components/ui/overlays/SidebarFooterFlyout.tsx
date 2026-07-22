import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";


interface MenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  href?: string;
  onClick: () => void;
  color?: string;
  hoverColor?: string;
}

interface SidebarFooterFlyoutProps {
  user: {
    name?: string;
    role?: string;
    avatar?: string;
    email?: string;
  } | null;
  menuItems: MenuItem[];
  children: React.ReactElement;
  show: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const SidebarFooterFlyout: React.FC<SidebarFooterFlyoutProps> = ({ 
  user,
  menuItems, 
  children, 
  show,
  onMouseEnter,
  onMouseLeave,
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
          const flyoutHeight = 260; // Estimated height
          
          const hasSpaceAbove = rect.top > flyoutHeight;

          if (hasSpaceAbove) {
            setCoords({
              bottom: viewportHeight - rect.bottom,
              left: rect.right + 12,
            });
          } else {
            setCoords({
              top: rect.top,
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
  }, [show]);

  const isVisible = show || isFlyoutHovered;

  return (
    <>
      {React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }>, { 
        ref: triggerRef,
        onMouseEnter: () => onMouseEnter(),
        onMouseLeave: () => onMouseLeave()
      })}
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
              className="min-w-[240px] bg-theme-surface border border-theme-border/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl bg-theme-surface/90"
            >
              {/* Premium User Header */}
              <div className="relative overflow-hidden p-4 bg-gradient-to-br from-theme-icon/20 via-theme-icon/5 to-transparent border-b border-theme-border/30">
                {/* Decorative background element */}
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-theme-icon/10 rounded-full blur-2xl" />
                
                <div className="flex items-center gap-3 relative z-10">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-tr from-theme-icon to-purple-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-theme-surface flex items-center justify-center overflow-hidden">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <img 
                          src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                          alt="User" 
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-semibold text-theme-text tracking-tight whitespace-normal break-words leading-tight">
                      {user?.name || "User"}
                    </span>
                    <span className="text-[10px] font-medium text-theme-icon/80 uppercase tracking-[0.15em] mt-1">
                      {user?.role || "Member"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2 space-y-0.5">
                {menuItems.slice(0, 2).map((item) => {
                  const isActive = item.href && location.pathname === item.href;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        item.onClick();
                        setIsFlyoutHovered(false);
                        onMouseLeave();
                      }}
                      className={`w-full flex items-center h-10 px-3 rounded-xl text-sm transition-all duration-300 font-medium group ${
                        isActive 
                          ? "bg-theme-icon/10 text-theme-icon shadow-sm" 
                          : item.color || "text-theme-text/70 hover:bg-theme-text/5 hover:text-theme-icon"
                      } ${item.hoverColor || ""}`}
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg mr-2 transition-colors ${isActive ? 'bg-theme-icon/10' : 'group-hover:bg-theme-icon/5'} ${isActive ? 'text-theme-icon' : (item.color ? 'opacity-100' : 'opacity-60 group-hover:opacity-100')}`}>
                        <item.icon className={`w-4 h-4 ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`} />
                      </div>
                      {item.label}
                    </button>
                  );
                })}
                <div className="border-t border-theme-border/70 my-1" />
                {menuItems.slice(2).map((item) => {
                  const isActive = item.href && location.pathname === item.href;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        item.onClick();
                        setIsFlyoutHovered(false);
                        onMouseLeave();
                      }}
                      className={`w-full flex items-center h-10 px-3 rounded-xl text-sm transition-all duration-300 font-medium group ${
                        isActive 
                          ? "bg-theme-icon/10 text-theme-icon shadow-sm" 
                          : item.color || "text-theme-text/70 hover:bg-theme-text/5 hover:text-theme-icon"
                      } ${item.hoverColor || ""}`}
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg mr-2 transition-colors ${isActive ? 'bg-theme-icon/10' : 'group-hover:bg-theme-icon/5'} ${isActive ? 'text-theme-icon' : (item.color ? 'opacity-100' : 'opacity-60 group-hover:opacity-100')}`}>
                        <item.icon className={`w-4 h-4 ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`} />
                      </div>
                      {item.label}
                    </button>
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

export default SidebarFooterFlyout;
