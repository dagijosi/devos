import {
  FaChartBar,
  FaFolder,
  FaBook,
  FaWrench,
  FaPlay,
  FaCog,
  FaRobot,
  FaLightbulb,
  FaSave,
} from "react-icons/fa";
import {
  DASHBOARD,
  PROJECTS,
  KNOWLEDGE,
  TOOLBOX,
  AUTOMATION,
  AI,
  INSIGHTS,
  BACKUP,
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
      { name: "Library", href: KNOWLEDGE, icon: FaBook },
    ],
  },
  {
    name: "Utilities",
    links: [
      { name: "AI Assistant", href: AI, icon: FaRobot },
      { name: "Insights", href: INSIGHTS, icon: FaLightbulb },
      { name: "Toolbox", href: TOOLBOX, icon: FaWrench },
      { name: "Automation", href: AUTOMATION, icon: FaPlay },
      { name: "Backup", href: BACKUP, icon: FaSave },
      { name: "Settings", href: SETTING, icon: FaCog },
    ],
  },
];
