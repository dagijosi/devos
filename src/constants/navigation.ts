import {
  FaChartBar,
  FaFolder,
  FaBook,
  FaWrench,
  FaPlay,
  FaCog,
} from "react-icons/fa";
import {
  DASHBOARD,
  PROJECTS,
  KNOWLEDGE,
  TOOLBOX,
  AUTOMATION,
  SETTING,
} from "../routes/types/routeConstants";

export interface NavLink {
  name: string;
  href?: string;
  icon?: React.ElementType;
  permissions?: string[];
  roles?: string[];
  entitlement?: string;
  children?: NavLink[];
}

export interface NavCategory {
  name: string;
  links: NavLink[];
  module?: string;
}

export const navigationCategories: NavCategory[] = [
  {
    name: "Workspace",
    links: [
      { name: "Dashboard", href: DASHBOARD, icon: FaChartBar },
      { name: "Projects", href: PROJECTS, icon: FaFolder },
      { name: "Knowledge", href: KNOWLEDGE, icon: FaBook },
    ],
  },
  {
    name: "Utilities",
    links: [
      { name: "Toolbox", href: TOOLBOX, icon: FaWrench },
      { name: "Automation", href: AUTOMATION, icon: FaPlay },
      { name: "Settings", href: SETTING, icon: FaCog },
    ],
  },
];
