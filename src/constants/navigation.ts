import {
  FaChartBar,
  FaFolder,
  FaBook,
  FaWrench,
  FaPlay,
  FaCog,
  FaSave,
  FaCode,
  FaClipboard,
  FaTelegram,
  FaRobot,
  FaLightbulb,
} from "react-icons/fa";
import {
  DASHBOARD,
  PROJECTS,
  KNOWLEDGE,
  UTILITIES,
  WORKFLOWS,
  BACKUP,
  SETTING,
  CLIPBOARD,
  SNIPPETS,
  TELEGRAM,
  INSIGHTS,
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
      { name: "Insights", href: INSIGHTS, icon: FaLightbulb },
    ],
  },
  {
    name: "Productivity",
    links: [
      { name: "Telegram Bot", href: TELEGRAM, icon: FaTelegram },
      { name: "AI Assistant", href: "/ai", icon: FaRobot },
    ],
  },
  {
    name: "Tools",
    links: [
      { name: "Utilities", href: UTILITIES, icon: FaWrench },
      { name: "Snippets", href: SNIPPETS, icon: FaCode },
      { name: "Clipboard", href: CLIPBOARD, icon: FaClipboard },
      { name: "Workflows", href: WORKFLOWS, icon: FaPlay },
      { name: "Backup", href: BACKUP, icon: FaSave },
      { name: "Settings", href: SETTING, icon: FaCog },
    ],
  },
];
