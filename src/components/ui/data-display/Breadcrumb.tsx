import React from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";

export interface BreadcrumbItem {
  name: string;
  path: string;
  icon?: React.ElementType;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  homeIcon?: React.ElementType;
  className?: string;
  itemClassName?: string;
  activeItemClassName?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = <FaChevronRight className="w-3 h-3 text-theme-text/40" />,
  homeIcon: HomeIcon,
  className = "",
  itemClassName = "",
  activeItemClassName = "",
}) => {
  const processedItems = items.map((item, index) => {
    if (index === 0 && HomeIcon && !item.icon) {
      return { ...item, icon: HomeIcon };
    }
    return item;
  });

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {processedItems.map((item, index) => {
        const Icon = item.icon;
        const isLast = index === processedItems.length - 1;

        return (
          <React.Fragment key={item.path}>
            {index > 0 && separator}
            <div className="flex items-center">
              {Icon && <Icon className="w-4 h-4 mr-2 text-theme-text/60" />}
              {isLast ? (
                <span
                  className={`text-sm font-medium text-theme-text ${itemClassName} ${activeItemClassName}`}
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className={`text-sm text-theme-text/60 hover:text-theme-icon transition-colors ${itemClassName}`}
                >
                  {item.name}
                </Link>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
