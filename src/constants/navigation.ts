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
  FaTelegram,
  FaCode,
} from "react-icons/fa";
import {
  DASHBOARD,
  PROJECTS,
  KNOWLEDGE,
  UTILITIES,
  WORKFLOWS,
  AI,
  INSIGHTS,
  BACKUP,
  SETTING,
  API_TYPE_GENERATOR,
  TELEGRAM,
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
      { name: "AI Assistant", href: AI, icon: FaRobot },
    ],
  },
  {
    name: "Productivity",
    links: [
      { name: "Workflows", href: WORKFLOWS, icon: FaPlay },
      { name: "Insights", href: INSIGHTS, icon: FaLightbulb },
      { name: "Telegram", href: TELEGRAM, icon: FaTelegram },
    ],
  },
  {
    name: "Tools",
    links: [
      { name: "Utilities", href: UTILITIES, icon: FaWrench },
      { name: "API Types", href: API_TYPE_GENERATOR, icon: FaCode },
      { name: "Backup", href: BACKUP, icon: FaSave },
      { name: "Settings", href: SETTING, icon: FaCog },
    ],
  },
];
