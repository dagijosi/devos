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
  FaClipboard,
  FaGlobe,
  FaTerminal,
  FaGitAlt,
  FaKey,
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
  CLIPBOARD,
  HOSTS_SWITCHER,
  TERMINAL,
  GIT_CLIENT,
  ENV_MANAGER,
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
      { name: "Terminal", href: TERMINAL, icon: FaTerminal },
      { name: "Git Client", href: GIT_CLIENT, icon: FaGitAlt },
      { name: "Environment", href: ENV_MANAGER, icon: FaKey },
      { name: "Utilities", href: UTILITIES, icon: FaWrench },
      { name: "Clipboard", href: CLIPBOARD, icon: FaClipboard },
      { name: "Hosts Switcher", href: HOSTS_SWITCHER, icon: FaGlobe },
      { name: "API Types", href: API_TYPE_GENERATOR, icon: FaCode },
      { name: "Backup", href: BACKUP, icon: FaSave },
      { name: "Settings", href: SETTING, icon: FaCog },
    ],
  },
];
