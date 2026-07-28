import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaChevronRight, FaFolder } from "react-icons/fa";
import { Portal, SidebarFooterFlyout } from "../overlays";
import { PROFILE, PROJECT_DETAIL } from "../../../routes/types/routeConstants";
import { useActiveProjectStore } from "../../../stores/activeProject.store";

interface MenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  href?: string;
  onClick: () => void;
}

interface SidebarFooterProps {
  isOpen: boolean;
  isMobile: boolean;
  onLinkClick?: () => void;
}

const user = { name: "Developer", role: "Admin" };

const SidebarFooter: React.FC<SidebarFooterProps> = ({
  isOpen,
  isMobile,
  onLinkClick,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHoveredUser, setIsHoveredUser] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0, width: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const activeProject = useActiveProjectStore((s) => s.activeProject);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  useEffect(() => {
    if (showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [showMenu]);

  const handleProfile = () => {
    navigate(PROFILE);
    setShowMenu(false);
    if (isMobile && onLinkClick) onLinkClick();
  };

  const menuItems: MenuItem[] = [
    { id: "profile", icon: FaUser, label: "Profile", href: PROFILE, onClick: handleProfile },
  ];

  const userAvatar = (
    <div className="relative shrink-0">
      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-theme-icon to-purple-500 p-0.5">
        <div className="w-full h-full rounded-full bg-theme-surface flex items-center justify-center overflow-hidden">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-theme-surface rounded-full shadow-sm" />
    </div>
  );

  return (
    <div className={`mt-auto transition-all duration-300 ${isOpen ? "p-2.5" : "p-2"}`}>
      {/* Active project indicator */}
      {isOpen && activeProject && (
        <button onClick={() => { navigate(PROJECT_DETAIL.replace(':id', String(activeProject.id))); if (isMobile && onLinkClick) onLinkClick(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 mb-2 rounded-xl bg-theme-icon/5 border border-theme-icon/15 hover:bg-theme-icon/10 transition-colors group">
          <div className="w-6 h-6 rounded-lg bg-theme-icon/10 flex items-center justify-center shrink-0">
            <FaFolder className="w-3 h-3 text-theme-icon" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-medium text-theme-text truncate">{activeProject.name}</p>
            <p className="text-[9px] text-theme-icon/60 uppercase tracking-widest">Active Project</p>
          </div>
        </button>
      )}

      {isOpen ? (
        <>
          <Portal>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  ref={menuRef}
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  style={{
                    position: 'fixed',
                    bottom: window.innerHeight - menuCoords.top + 10,
                    left: menuCoords.left,
                    width: menuCoords.width,
                  }}
                  className="p-1 bg-theme-surface border border-theme-border/50 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] z-[9999] space-y-0.5 backdrop-blur-xl"
                >
                  {menuItems.map((item) => {
                    const isActive = item.href && location.pathname === item.href;
                    return (
                      <button key={item.id}
                        className={`w-full flex items-center h-10 px-3 rounded-lg transition-all duration-200 group ${
                          isActive ? "bg-theme-icon/10 text-theme-icon shadow-sm" : "text-theme-text/70 hover:bg-theme-text/5 hover:text-theme-icon"
                        }`}
                        onClick={item.onClick}>
                        <item.icon className="w-4 h-4 mr-2.5" />
                        <span className="font-medium whitespace-nowrap text-sm">{item.label}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </Portal>

          <motion.button ref={buttonRef} whileTap={{ scale: 0.98 }} onClick={() => setShowMenu(!showMenu)}
            className={`w-full flex items-center p-2 rounded-xl transition-all duration-300 border group ${
              showMenu ? "bg-theme-icon/5 border-theme-icon/20" : "bg-theme-text/[0.03] border-theme-border/20 hover:border-theme-border/50"
            }`}>
            {userAvatar}
            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }} className="flex flex-col items-start min-w-0 flex-1 ml-3">
                  <span className="text-sm font-semibold text-theme-text tracking-tight whitespace-nowrap overflow-hidden text-left leading-tight">{user.name}</span>
                  <span className="text-[10px] font-medium text-theme-icon/80 uppercase tracking-widest mt-1">{user.role}</span>
                </motion.div>
              )}
            </AnimatePresence>
            {isOpen && <FaChevronRight size={10} className={`text-theme-text/30 transition-transform ml-3 ${showMenu ? 'rotate-90' : ''}`} />}
          </motion.button>
        </>
      ) : (
        <div className="flex flex-col items-center">
          {!isMobile ? (
            <SidebarFooterFlyout user={user} menuItems={menuItems} show={isHoveredUser}
              onMouseEnter={() => setIsHoveredUser(true)} onMouseLeave={() => setIsHoveredUser(false)}>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="relative flex items-center justify-center w-10 h-10 rounded-xl border bg-theme-text/[0.03] border-theme-border/20">
                {userAvatar}
              </motion.button>
            </SidebarFooterFlyout>
          ) : (
            <button onClick={handleProfile} className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-theme-text/[0.03] border border-theme-border/20">
              {userAvatar}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SidebarFooter;
