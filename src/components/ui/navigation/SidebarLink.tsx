import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { SidebarTooltip, SidebarFlyout } from "../overlays";
import type { NavLink } from "../../../constants/navigation";

interface SidebarLinkProps {
  link: NavLink;
  isActive: boolean;
  hasActiveChild?: boolean;
  isOpen: boolean;
  isMobile: boolean;
  onClick: () => void;
  level?: number;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ 
  link, 
  isActive, 
  hasActiveChild = false,
  isOpen, 
  isMobile, 
  onClick,
  level = 0
}) => {
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(isActive || hasActiveChild);
  const hasChildren = !!link.children && link.children.length > 0;

  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (hasChildren && isOpen) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      handleToggle(e);
    }
  };

  const baseClasses = `
    relative flex items-center justify-between h-11 sm:h-12 rounded-xl transition-all duration-200 group touch-manipulation overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-theme-icon/50
    ${
      isActive
        ? "bg-theme-icon/10 text-theme-icon shadow-lg shadow-theme-icon/20"
        : "text-theme-text/70 hover:bg-theme-text/5 hover:text-theme-icon active:bg-theme-text/10"
    }
    ${isOpen && level > 0 ? `ml-${level * 2} md:ml-${level * 3}` : ""}
  `;

  const iconContainer = (
    <motion.div 
      className={`flex items-center ${isOpen ? "relative" : "absolute inset-y-0 left-0"}`}
      animate={{ 
        left: isOpen ? "auto" : "50%",
        x: isOpen ? "0%" : "-50%",
        paddingLeft: isOpen ? (isMobile ? "12px" : "16px") : "0px",
      }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="flex items-center justify-center min-w-[24px] shrink-0 relative">
        {link.icon && <link.icon className="w-4 h-4" />}
        
        {/* Active Indicator Dot for Collapsed States */}
        {((!isOpen && (isActive || hasActiveChild)) || (isOpen && hasChildren && !isExpanded && hasActiveChild)) && (
          <motion.div 
            layoutId="activeDot"
            className="absolute -right-1 -top-1 w-2 h-2 bg-theme-icon rounded-full border-2 border-theme-surface shadow-[0_0_10px_rgba(79,70,229,0.4)]" 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          />
        )}
      </div>

      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: isMobile ? 0.15 : 0.4, 
              ease: [0.4, 0, 0.2, 1],
              delay: isMobile ? 0 : 0.1
            }}
            className="font-semibold whitespace-nowrap ml-3 overflow-hidden text-[15px]"
          >
            {link.name}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const navItem = (
    <div className="space-y-1">
      {link.href ? (
        <Link
          to={link.href}
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onKeyDown={handleKeyDown}
          className={baseClasses}
        >
          {iconContainer}
          {isOpen && hasChildren && (
            <div
              onClick={handleToggle}
              className="flex items-center justify-center w-8 h-8 mr-2 text-theme-text/40 hover:text-theme-icon transition-colors"
            >
              {isExpanded ? (
                <FaChevronUp className="w-3 h-3" />
              ) : (
                <FaChevronDown className="w-3 h-3" />
              )}
            </div>
          )}
        </Link>
      ) : (
        <button
          onClick={handleToggle}
          type="button"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onKeyDown={handleKeyDown}
          className={`${baseClasses} w-full`}
        >
          {iconContainer}
          {isOpen && hasChildren && (
            <div className="flex items-center justify-center w-8 h-8 mr-2 text-theme-text/40 hover:text-theme-icon transition-colors">
              {isExpanded ? (
                <FaChevronUp className="w-3 h-3" />
              ) : (
                <FaChevronDown className="w-3 h-3" />
              )}
            </div>
          )}
        </button>
      )}

      <AnimatePresence>
        {isOpen && hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {link.children!.map((childLink) => (
              <SidebarLink
                key={childLink.name}
                link={childLink}
                isActive={childLink.href ? location.pathname === childLink.href : false}
                hasActiveChild={false}
                isOpen={isOpen}
                isMobile={isMobile}
                onClick={onClick}
                level={level + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // If sidebar is collapsed and not mobile, use either Tooltip or Flyout
  if (!isOpen && !isMobile) {
    if (hasChildren) {
      return (
        <SidebarFlyout
          link={link}
          show={isHovered}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={onClick}
        >
          {navItem}
        </SidebarFlyout>
      );
    }
    return (
      <SidebarTooltip content={link.name} show={isHovered}>
        {navItem}
      </SidebarTooltip>
    );
  }

  return navItem;
};

export default SidebarLink;
