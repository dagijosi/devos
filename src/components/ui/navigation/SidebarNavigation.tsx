import React from "react";
import { useLocation } from "react-router-dom";
import { navigationCategories } from "../../../constants/navigation";
import type { NavLink } from "../../../constants/navigation";
import { SidebarCategory } from "./SidebarCategory";
import SidebarLink from "./SidebarLink";
import { useAbility } from "../../../hooks/useAbility";
import { useBusinessModules } from "../../../hooks/useBusinessModules";

interface SidebarNavigationProps {
  isOpen: boolean;
  isMobile: boolean;
  onLinkClick: () => void;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  isOpen,
  isMobile,
  onLinkClick,
}) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { can } = useAbility();
  const { isModuleEnabled } = useBusinessModules();

  // Recursively filter links and check permissions
  const filterLinks = (links: NavLink[]): NavLink[] => {
    return links
      .map((link) => {
        const hasPermission = can({
          permission: link.permissions,
          role: link.roles,
          entitlement: link.entitlement,
        });
        if (!hasPermission) return null;

        const filteredChildren = link.children ? filterLinks(link.children) : [];
        
        return {
          ...link,
          children: filteredChildren.length > 0 ? filteredChildren : undefined,
        };
      })
      .filter(Boolean) as NavLink[];
  };

  // Recursively check if any child is active
  const hasActiveChild = (link: NavLink): boolean => {
    if (link.children) {
      return link.children.some((child) => 
        (child.href && currentPath === child.href) || hasActiveChild(child)
      );
    }
    return false;
  };

  const isExactActive = (link: NavLink): boolean => {
    return link.href ? currentPath === link.href : false;
  };

  // Filter categories and links based on user permissions, roles, and entitlements
  const categoriesToRender = navigationCategories.filter((category) => isModuleEnabled(category.module));

  const visibleCategories = categoriesToRender
    .map((category) => ({
      ...category,
      links: filterLinks(category.links),
    }))
    .filter((category) => category.links.length > 0); // Only show categories with visible links

  const handleLinkClick = () => {
    if (isMobile) {
      onLinkClick();
    }
  };

  return (
    <nav
      className={`flex-1 flex flex-col py-4 sm:py-6 overflow-hidden ${isOpen ? "px-2 sm:px-3" : "px-2"}`}
    >
      <div className="flex flex-col space-y-3 sm:space-y-4 overflow-y-auto overflow-x-hidden sidebar-scrollbar pr-1">
        {visibleCategories.map((category, categoryIndex) => (
          <SidebarCategory
            key={category.name}
            name={category.name}
            isOpen={isOpen}
            isMobile={isMobile}
            categoryIndex={categoryIndex}
          >
            {category.links.map((link) => (
              <SidebarLink
                key={link.name}
                link={link}
                isActive={isExactActive(link)}
                hasActiveChild={hasActiveChild(link)}
                isOpen={isOpen}
                isMobile={isMobile}
                onClick={handleLinkClick}
              />
            ))}
          </SidebarCategory>
        ))}
      </div>
    </nav>
  );
};

export default SidebarNavigation;
