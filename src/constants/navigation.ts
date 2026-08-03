import {
  FaChartBar,
  FaFolder,
  FaBook,
  FaWrench,
  FaPlay,
  FaCog,
  FaSave,
  FaClipboard,
  FaTelegram,
  FaRobot,
  FaLightbulb,
  FaHome,
  FaTasks,
  FaTerminal,
  FaGitAlt,
  FaCube,
  FaKey,
  FaCloudUploadAlt,
  FaRocket,
  FaLink,
} from "react-icons/fa";
import {
  HOME,
  PROJECTS,
  LIBRARY,
  UTILITIES,
  WORKFLOWS,
  BACKUP,
  SETTING,
  CLIPBOARD,
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

// ── Mode A: Workspace (no project selected) ─────────────────────────
export const workspaceNavigationCategories: NavCategory[] = [
  {
    name: "Workspace",
    links: [
      { name: "Home", href: HOME, icon: FaHome },
      { name: "All Projects", href: PROJECTS, icon: FaFolder },
      { name: "Library", href: LIBRARY, icon: FaBook },
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
      { name: "Clipboard", href: CLIPBOARD, icon: FaClipboard },
      { name: "Workflows", href: WORKFLOWS, icon: FaPlay },
      { name: "Backup", href: BACKUP, icon: FaSave },
    ],
  },
  {
    name: "System",
    links: [{ name: "Settings", href: SETTING, icon: FaCog }],
  },
];

// ── Mode B: Project Hub (project-scoped nav, concrete hrefs) ────────
const PROJECT_NAV_MODULES = new Set([
  'tasks', 'knowledge', 'terminal', 'git', 'dependencies', 'environment',
  'run-configs', 'deployments', 'workflows', 'apis',
]);

export function projectNavigationCategories(
  id: string | number,
  projectName?: string,
  enabledModules?: string[] | null
): NavCategory[] {
  const base = `/projects/${id}`;
  const p = (seg: string) => `${base}/${seg}`;
  const moduleSet = enabledModules ? new Set(enabledModules) : null;

  const filterLinks = (links: NavLink[]): NavLink[] =>
    links.filter((l) => {
      if (!l.href) return true;
      const seg = l.href.slice(base.length + 1);
      if (!PROJECT_NAV_MODULES.has(seg)) return true;
      return moduleSet ? moduleSet.has(seg) : true;
    });

  const categories: NavCategory[] = [
    {
      name: projectName || "Project",
      links: [
        { name: "Back to Home", href: HOME, icon: FaHome },
        { name: "Dashboard", href: base, icon: FaChartBar },
      ],
    },
    {
      name: "Work",
      links: [
        { name: "Tasks", href: p("tasks"), icon: FaTasks },
        { name: "Knowledge", href: p("knowledge"), icon: FaBook },
      ],
    },
    {
      name: "Code",
      links: [
        { name: "Terminal", href: p("terminal"), icon: FaTerminal },
        { name: "Git", href: p("git"), icon: FaGitAlt },
        { name: "Dependencies", href: p("dependencies"), icon: FaCube },
        { name: "Environment", href: p("environment"), icon: FaKey },
      ],
    },
    {
      name: "Ship",
      links: [
        { name: "Run", href: p("run-configs"), icon: FaPlay },
        { name: "Deployments", href: p("deployments"), icon: FaCloudUploadAlt },
        { name: "Workflows", href: p("workflows"), icon: FaRocket },
        { name: "APIs", href: p("apis"), icon: FaLink },
      ],
    },
    {
      name: "Settings",
      links: [{ name: "Settings", href: p("settings"), icon: FaCog }],
    },
  ];

  return categories
    .map((c) => ({ ...c, links: filterLinks(c.links) }))
    .filter((c) => c.links.length > 0);
}

// Backward-compatible alias (global mode)
export const navigationCategories = workspaceNavigationCategories;
