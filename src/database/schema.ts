export const SETTINGS_TABLE = `CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

export const NOTIFICATIONS_TABLE = `CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('info', 'success', 'warning', 'error')),
  read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

export const PROJECTS_TABLE = `CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT '#6366f1',
  category TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  technology TEXT DEFAULT '[]',
  favorite INTEGER DEFAULT 0,
  pinned INTEGER DEFAULT 0,
  repository_url TEXT DEFAULT '',
  local_path TEXT DEFAULT '',
  scripts TEXT DEFAULT '{}',
  environment TEXT DEFAULT '{}',
  enabled_modules TEXT,
  last_opened DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

export const NOTES_TABLE = `CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  folder_id INTEGER,
  tags TEXT DEFAULT '[]',
  favorite INTEGER DEFAULT 0,
  pinned INTEGER DEFAULT 0,
  project_id INTEGER,
  last_opened DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);`;

export const FOLDERS_TABLE = `CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER,
  icon TEXT DEFAULT 'folder',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);`;

export const CODE_SNIPPETS_TABLE = `CREATE TABLE IF NOT EXISTS code_snippets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  description TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  favorite INTEGER DEFAULT 0,
  project_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);`;

export const BUGS_TABLE = `CREATE TABLE IF NOT EXISTS bugs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  problem TEXT NOT NULL,
  solution TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  project_id INTEGER,
  status TEXT DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);`;

export const ATTACHMENTS_TABLE = `CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id INTEGER,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);`;

// FTS5 virtual table — will silently fail if fts5 module is unavailable (sql.js default build)
export const ENV_PROFILES_TABLE = `CREATE TABLE IF NOT EXISTS env_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  variables TEXT DEFAULT '{}',
  is_active INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);`;

export const HOSTS_PROFILES_TABLE = `CREATE TABLE IF NOT EXISTS hosts_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  entries TEXT DEFAULT '[]',
  is_active INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

export const CLIPBOARD_TABLE = `CREATE TABLE IF NOT EXISTS clipboard_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  source TEXT DEFAULT '',
  favorite INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

export const NOTES_FTS_TABLE = `CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
  title, content, tags, content='notes', content_rowid='id'
);`;

// Clean up old triggers (they were previously managed at DB level but caused failures when fts5 is unavailable)
export const NOTES_FTS_DROP_TRIGGERS = `
  DROP TRIGGER IF EXISTS notes_ai;
  DROP TRIGGER IF EXISTS notes_ad;
  DROP TRIGGER IF EXISTS notes_au;
`;

export const RECENT_ACTIVITY_TABLE = `CREATE TABLE IF NOT EXISTS recent_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

export const TAGS_TABLE = `CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

export const USERS_TABLE = `CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'Administrator',
  permissions TEXT DEFAULT '["all"]',
  business_modules TEXT DEFAULT '["Workspace", "Utilities"]',
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

export const WORKFLOWS_TABLE = `CREATE TABLE IF NOT EXISTS workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  steps TEXT DEFAULT '[]',
  tags TEXT DEFAULT '[]',
  favorite INTEGER DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'custom',
  last_run_at DATETIME,
  last_run_status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

export const WORKFLOW_LOGS_TABLE = `CREATE TABLE IF NOT EXISTS workflow_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  step_logs TEXT DEFAULT '[]',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);`;

export const AI_CONVERSATIONS_TABLE = `CREATE TABLE IF NOT EXISTS ai_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  provider TEXT DEFAULT '',
  model TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

export const AI_MESSAGES_TABLE = `CREATE TABLE IF NOT EXISTS ai_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  tool_calls TEXT DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
);`;

export const ANALYTICS_SESSIONS_TABLE = `CREATE TABLE IF NOT EXISTS analytics_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'focus',
  label TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

export const BACKUPS_TABLE = `CREATE TABLE IF NOT EXISTS backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  size_bytes INTEGER DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'manual',
  encrypted INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

export const PROJECT_PATHS_TABLE = `CREATE TABLE IF NOT EXISTS project_paths (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  path TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'local',
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);`;

export const PROJECT_SCRIPTS_TABLE = `CREATE TABLE IF NOT EXISTS project_scripts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  command TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);`;

export const PROJECT_LINKS_TABLE = `CREATE TABLE IF NOT EXISTS project_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);`;

export const PROJECT_TASKS_TABLE = `CREATE TABLE IF NOT EXISTS project_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'todo',
  due_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);`;

export const PROJECT_ACTIVITY_TABLE = `CREATE TABLE IF NOT EXISTS project_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'update',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);`;

// Migration-safe column additions (silently fail if columns exist)
export const PROJECTS_ADD_ICON = `ALTER TABLE projects ADD COLUMN icon TEXT DEFAULT 'folder';`;
export const PROJECTS_ADD_COLOR = `ALTER TABLE projects ADD COLUMN color TEXT DEFAULT '#6366f1';`;
export const PROJECTS_ADD_CATEGORY = `ALTER TABLE projects ADD COLUMN category TEXT DEFAULT '';`;
export const PROJECTS_ADD_TAGS = `ALTER TABLE projects ADD COLUMN tags TEXT DEFAULT '[]';`;
export const PROJECTS_ADD_TECHNOLOGY = `ALTER TABLE projects ADD COLUMN technology TEXT DEFAULT '[]';`;
export const PROJECTS_ADD_SCRIPTS = `ALTER TABLE projects ADD COLUMN scripts TEXT DEFAULT '{}';`;
export const PROJECTS_ADD_ENVIRONMENT = `ALTER TABLE projects ADD COLUMN environment TEXT DEFAULT '{}';`;
export const PROJECTS_ADD_FAVORITE = `ALTER TABLE projects ADD COLUMN favorite INTEGER DEFAULT 0;`;
export const PROJECTS_ADD_PINNED = `ALTER TABLE projects ADD COLUMN pinned INTEGER DEFAULT 0;`;
export const PROJECTS_ADD_REPOSITORY_URL = `ALTER TABLE projects ADD COLUMN repository_url TEXT DEFAULT '';`;
export const PROJECTS_ADD_LOCAL_PATH = `ALTER TABLE projects ADD COLUMN local_path TEXT DEFAULT '';`;
export const PROJECTS_ADD_LAST_OPENED = `ALTER TABLE projects ADD COLUMN last_opened DATETIME;`;
export const PROJECTS_ADD_UPDATED_AT = `ALTER TABLE projects ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;`;

// ── Unified Knowledge / Library tables ─────────────────────────────────

export const KNOWLEDGE_ITEMS_TABLE = `CREATE TABLE IF NOT EXISTS knowledge_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('note','bug','snippet','prompt','doc','bookmark','template')),
  content TEXT DEFAULT '',
  description TEXT DEFAULT '',
  language TEXT DEFAULT '',
  url TEXT DEFAULT '',
  problem TEXT DEFAULT '',
  cause TEXT DEFAULT '',
  solution TEXT DEFAULT '',
  severity TEXT DEFAULT '',
  category TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  favorite INTEGER DEFAULT 0,
  pinned INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived','trashed')),
  project_id INTEGER,
  folder_id INTEGER,
  last_opened DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);`;

export const RELATIONS_TABLE = `CREATE TABLE IF NOT EXISTS relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL,
  target_id INTEGER NOT NULL,
  relation_type TEXT NOT NULL DEFAULT 'related',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_id) REFERENCES knowledge_items(id) ON DELETE CASCADE,
  FOREIGN KEY (target_id) REFERENCES knowledge_items(id) ON DELETE CASCADE
);`;

export const KNOWLEDGE_FOLDERS_TABLE = `CREATE TABLE IF NOT EXISTS knowledge_folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES knowledge_folders(id) ON DELETE CASCADE
);`;

export const ACTIVITY_LOGS_TABLE = `CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  type TEXT NOT NULL,
  description TEXT DEFAULT '',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  duration INTEGER DEFAULT 0,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);`;

export const DAILY_STATS_TABLE = `CREATE TABLE IF NOT EXISTS daily_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  focus_time INTEGER DEFAULT 0,
  projects INTEGER DEFAULT 0,
  tasks INTEGER DEFAULT 0,
  commits INTEGER DEFAULT 0,
  notes INTEGER DEFAULT 0,
  bugs INTEGER DEFAULT 0
);`;

export const PROJECT_STATS_TABLE = `CREATE TABLE IF NOT EXISTS project_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL UNIQUE,
  total_time INTEGER DEFAULT 0,
  last_opened DATETIME,
  commits INTEGER DEFAULT 0,
  notes INTEGER DEFAULT 0,
  bugs INTEGER DEFAULT 0,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);`;

export const GOALS_TABLE = `CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  target INTEGER DEFAULT 100,
  progress INTEGER DEFAULT 0,
  deadline DATETIME,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed','archived')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

export const TOOLS_TABLE = `CREATE TABLE IF NOT EXISTS tools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '',
  favorite INTEGER DEFAULT 0
);`;

export const RECENT_TOOLS_TABLE = `CREATE TABLE IF NOT EXISTS recent_tools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id INTEGER NOT NULL,
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE
);`;

export const DEPLOYMENTS_TABLE = `CREATE TABLE IF NOT EXISTS deployments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'custom',
  url TEXT DEFAULT '',
  build_command TEXT DEFAULT '',
  branch TEXT DEFAULT 'main',
  auto_deploy INTEGER DEFAULT 0,
  status TEXT DEFAULT 'idle',
  last_deployed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);`;

export const DEPLOYMENT_LOGS_TABLE = `CREATE TABLE IF NOT EXISTS deployment_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deployment_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  output TEXT DEFAULT '',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (deployment_id) REFERENCES deployments(id) ON DELETE CASCADE
);`;

export const TOOL_SETTINGS_TABLE = `CREATE TABLE IF NOT EXISTS tool_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id INTEGER NOT NULL,
  settings_json TEXT DEFAULT '{}',
  FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE
);`;

// ── Notification rules ──────────────────────────────────────────────────
export const NOTIFICATION_RULES_TABLE = `CREATE TABLE IF NOT EXISTS notification_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type IN ('workflow_failed', 'deployment_failed', 'deployment_success', 'dependency_vulnerable', 'task_overdue', 'task_due_soon', 'git_conflict', 'build_failed', 'service_crashed')),
  condition TEXT DEFAULT '{}',
  action_type TEXT NOT NULL DEFAULT 'toast' CHECK(action_type IN ('toast', 'notification', 'webhook', 'email')),
  action_config TEXT DEFAULT '{}',
  enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

export const NOTIFICATION_RULE_QUERIES = {
  getAll: `SELECT * FROM notification_rules ORDER BY enabled DESC, created_at DESC`,
  getEnabled: `SELECT * FROM notification_rules WHERE enabled = 1 ORDER BY event_type`,
  getByEvent: `SELECT * FROM notification_rules WHERE enabled = 1 AND event_type = ?`,
  getById: `SELECT * FROM notification_rules WHERE id = ?`,
  insert: `INSERT INTO notification_rules (name, event_type, condition, action_type, action_config) VALUES (?, ?, ?, ?, ?)`,
  update: `UPDATE notification_rules SET name = ?, event_type = ?, condition = ?, action_type = ?, action_config = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  toggleEnabled: `UPDATE notification_rules SET enabled = CASE WHEN enabled = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  delete: `DELETE FROM notification_rules WHERE id = ?`,
};

// ── Task links (connect tasks to notes, bugs, commits, deployments) ──────
export const TASK_LINKS_TABLE = `CREATE TABLE IF NOT EXISTS task_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  linked_type TEXT NOT NULL CHECK(linked_type IN ('note', 'bug', 'commit', 'deployment', 'knowledge')),
  linked_id INTEGER NOT NULL,
  linked_title TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE
);`;

export const TASK_LINK_QUERIES = {
  getByTask: `SELECT * FROM task_links WHERE task_id = ? ORDER BY created_at DESC`,
  getByLinked: `SELECT * FROM task_links WHERE linked_type = ? AND linked_id = ?`,
  insert: `INSERT INTO task_links (task_id, linked_type, linked_id, linked_title) VALUES (?, ?, ?, ?)`,
  delete: `DELETE FROM task_links WHERE id = ?`,
  deleteByTask: `DELETE FROM task_links WHERE task_id = ?`,
};

// ── Command templates per technology stack ─────────────────────────────
export const COMMAND_TEMPLATES_TABLE = `CREATE TABLE IF NOT EXISTS command_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  command TEXT NOT NULL,
  technology TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'dev' CHECK(category IN ('dev', 'build', 'test', 'lint', 'deploy', 'docker', 'git', 'db')),
  favorite INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

export const COMMAND_TEMPLATE_QUERIES = {
  getAll: `SELECT * FROM command_templates ORDER BY usage_count DESC, name ASC`,
  getByTechnology: `SELECT * FROM command_templates WHERE technology = ? ORDER BY usage_count DESC`,
  getByCategory: `SELECT * FROM command_templates WHERE category = ? ORDER BY usage_count DESC`,
  getById: `SELECT * FROM command_templates WHERE id = ?`,
  insert: `INSERT INTO command_templates (name, description, command, technology, category) VALUES (?, ?, ?, ?, ?)`,
  update: `UPDATE command_templates SET name = ?, description = ?, command = ?, technology = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  incrementUsage: `UPDATE command_templates SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  toggleFavorite: `UPDATE command_templates SET favorite = CASE WHEN favorite = 1 THEN 0 ELSE 1 END WHERE id = ?`,
  delete: `DELETE FROM command_templates WHERE id = ?`,
  search: `SELECT * FROM command_templates WHERE name LIKE ? OR description LIKE ? OR command LIKE ? OR technology LIKE ? ORDER BY usage_count DESC`,
};

// ── Workflow trigger extensions ─────────────────────────────────────────
export const WORKFLOW_TRIGGER_CONFIG_TABLE = `CREATE TABLE IF NOT EXISTS workflow_trigger_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id INTEGER NOT NULL UNIQUE,
  trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK(trigger_type IN ('manual', 'schedule', 'app_startup', 'project_opened', 'file_change', 'git_event', 'terminal_command')),
  trigger_config TEXT DEFAULT '{}',
  enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);`;

export const WORKFLOW_TRIGGER_CONFIG_QUERIES = {
  getByWorkflow: `SELECT * FROM workflow_trigger_config WHERE workflow_id = ?`,
  getAllEnabled: `SELECT wtc.*, w.name as workflow_name, w.steps FROM workflow_trigger_config wtc JOIN workflows w ON wtc.workflow_id = w.id WHERE wtc.enabled = 1`,
  getByTriggerType: `SELECT wtc.*, w.name as workflow_name, w.steps FROM workflow_trigger_config wtc JOIN workflows w ON wtc.workflow_id = w.id WHERE wtc.trigger_type = ? AND wtc.enabled = 1`,
  insert: `INSERT INTO workflow_trigger_config (workflow_id, trigger_type, trigger_config) VALUES (?, ?, ?)`,
  update: `UPDATE workflow_trigger_config SET trigger_type = ?, trigger_config = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE workflow_id = ?`,
  toggleEnabled: `UPDATE workflow_trigger_config SET enabled = CASE WHEN enabled = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  delete: `DELETE FROM workflow_trigger_config WHERE workflow_id = ?`,
};

// ── Team sync ───────────────────────────────────────────────────────────
export const TEAM_SYNC_CONFIG_TABLE = `CREATE TABLE IF NOT EXISTS team_sync_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL DEFAULT 'local' CHECK(provider IN ('local', 'git', 'http', 'custom')),
  sync_url TEXT DEFAULT '',
  sync_token TEXT DEFAULT '',
  auto_sync INTEGER DEFAULT 0,
  sync_interval_minutes INTEGER DEFAULT 60,
  last_sync_at DATETIME,
  sync_entities TEXT DEFAULT '["projects","tasks","workflows","knowledge"]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

export const TEAM_SYNC_CONFIG_QUERIES = {
  get: `SELECT * FROM team_sync_config LIMIT 1`,
  upsert: `INSERT INTO team_sync_config (provider, sync_url, sync_token, auto_sync, sync_interval_minutes, sync_entities) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET provider = excluded.provider, sync_url = excluded.sync_url, sync_token = excluded.sync_token, auto_sync = excluded.auto_sync, sync_interval_minutes = excluded.sync_interval_minutes, sync_entities = excluded.sync_entities, updated_at = CURRENT_TIMESTAMP`,
  updateLastSync: `UPDATE team_sync_config SET last_sync_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
};

// ── Workflow trigger type extension ──────────────────────────────────────
export const WORKFLOW_TRIGGER_MIGRATIONS = [
  `ALTER TABLE workflows ADD COLUMN trigger_type TEXT DEFAULT 'manual'`,
  `ALTER TABLE workflows ADD COLUMN trigger_config TEXT DEFAULT '{}'`,
  `ALTER TABLE workflows ADD COLUMN trigger_enabled INTEGER DEFAULT 1`,
];

// ── Project-scoping migrations (Phase 4) ─────────────────────────────────
// Workflows become project-scoped (NULL = global template)
export const WORKFLOWS_ADD_PROJECT_ID = `ALTER TABLE workflows ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;`;
// AI conversations get optional project context
export const AI_CONVERSATIONS_ADD_PROJECT_ID = `ALTER TABLE ai_conversations ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;`;
// Optional project-level notification rule overrides
export const NOTIFICATION_RULES_ADD_PROJECT_ID = `ALTER TABLE notification_rules ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;`;
// Per-project enabled modules (Phase 5) — which hub sections are shown
export const PROJECTS_ADD_ENABLED_MODULES = `ALTER TABLE projects ADD COLUMN enabled_modules TEXT;`;

export const ALL_MIGRATIONS = [
  SETTINGS_TABLE,
  NOTIFICATIONS_TABLE,
  FOLDERS_TABLE,
  PROJECTS_TABLE,
  NOTES_TABLE,
  CODE_SNIPPETS_TABLE,
  BUGS_TABLE,
  ATTACHMENTS_TABLE,
  RECENT_ACTIVITY_TABLE,
  TAGS_TABLE,
  USERS_TABLE,
  WORKFLOWS_TABLE,
  WORKFLOW_LOGS_TABLE,
  AI_CONVERSATIONS_TABLE,
  AI_MESSAGES_TABLE,
  ANALYTICS_SESSIONS_TABLE,
  BACKUPS_TABLE,
  PROJECT_PATHS_TABLE,
  PROJECT_SCRIPTS_TABLE,
  PROJECT_LINKS_TABLE,
  PROJECT_TASKS_TABLE,
  PROJECT_ACTIVITY_TABLE,
  // Column additions (may fail silently)
  PROJECTS_ADD_ICON,
  PROJECTS_ADD_COLOR,
  PROJECTS_ADD_CATEGORY,
  PROJECTS_ADD_TAGS,
  PROJECTS_ADD_TECHNOLOGY,
  PROJECTS_ADD_SCRIPTS,
  PROJECTS_ADD_ENVIRONMENT,
  PROJECTS_ADD_FAVORITE,
  PROJECTS_ADD_PINNED,
  PROJECTS_ADD_REPOSITORY_URL,
  PROJECTS_ADD_LOCAL_PATH,
  PROJECTS_ADD_LAST_OPENED,
  PROJECTS_ADD_UPDATED_AT,
  PROJECTS_ADD_ENABLED_MODULES,
  // Env profiles
  ENV_PROFILES_TABLE,
  // Hosts profiles
  HOSTS_PROFILES_TABLE,
  // Clipboard
  CLIPBOARD_TABLE,
  // FTS cleanup (drop old triggers that fail when fts5 module is unavailable)
  NOTES_FTS_DROP_TRIGGERS,
  // FTS - will silently fail if fts5 unavailable (sql.js default build)
  NOTES_FTS_TABLE,
  // Unified Knowledge / Library tables
  KNOWLEDGE_ITEMS_TABLE,
  RELATIONS_TABLE,
  KNOWLEDGE_FOLDERS_TABLE,
  // Insights tables
  ACTIVITY_LOGS_TABLE,
  DAILY_STATS_TABLE,
  PROJECT_STATS_TABLE,
  GOALS_TABLE,
  // Utilities tables
  TOOLS_TABLE,
  RECENT_TOOLS_TABLE,
  TOOL_SETTINGS_TABLE,
  // Deployments tables
  DEPLOYMENTS_TABLE,
  DEPLOYMENT_LOGS_TABLE,
  // Notification rules
  NOTIFICATION_RULES_TABLE,
  // Task links
  TASK_LINKS_TABLE,
  // Command templates
  COMMAND_TEMPLATES_TABLE,
  // Workflow trigger config
  WORKFLOW_TRIGGER_CONFIG_TABLE,
  // Team sync config
  TEAM_SYNC_CONFIG_TABLE,
  // Workflow trigger column migrations
  ...WORKFLOW_TRIGGER_MIGRATIONS,
  // Project-scoping migrations (Phase 4)
  WORKFLOWS_ADD_PROJECT_ID,
  AI_CONVERSATIONS_ADD_PROJECT_ID,
  NOTIFICATION_RULES_ADD_PROJECT_ID,
];

// ── Query constants ────────────────────────────────────────────────────

export const ENV_PROFILE_QUERIES = {
  getByProject: `SELECT * FROM env_profiles WHERE project_id = ? ORDER BY updated_at DESC`,
  getById: `SELECT * FROM env_profiles WHERE id = ?`,
  insert: `INSERT INTO env_profiles (project_id, name, description, variables, is_active) VALUES (?, ?, ?, ?, ?)`,
  update: `UPDATE env_profiles SET name = ?, description = ?, variables = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  delete: `DELETE FROM env_profiles WHERE id = ?`,
  deleteByProject: `DELETE FROM env_profiles WHERE project_id = ?`,
  deactivateByProject: `UPDATE env_profiles SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE project_id = ?`,
  setActive: `UPDATE env_profiles SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  getActive: `SELECT * FROM env_profiles WHERE project_id = ? AND is_active = 1 LIMIT 1`,
};

export const HOSTS_PROFILE_QUERIES = {
  getAll: `SELECT * FROM hosts_profiles ORDER BY updated_at DESC`,
  getById: `SELECT * FROM hosts_profiles WHERE id = ?`,
  insert: `INSERT INTO hosts_profiles (name, description, entries, is_active) VALUES (?, ?, ?, ?)`,
  update: `UPDATE hosts_profiles SET name = ?, description = ?, entries = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  delete: `DELETE FROM hosts_profiles WHERE id = ?`,
  deactivateAll: `UPDATE hosts_profiles SET is_active = 0, updated_at = CURRENT_TIMESTAMP`,
  setActive: `UPDATE hosts_profiles SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
};

export const CLIPBOARD_QUERIES = {
  getAll: `SELECT * FROM clipboard_entries ORDER BY created_at DESC LIMIT 200`,
  getFavorites: `SELECT * FROM clipboard_entries WHERE favorite = 1 ORDER BY created_at DESC`,
  insert: `INSERT INTO clipboard_entries (content, content_type, source) VALUES (?, ?, ?)`,
  delete: `DELETE FROM clipboard_entries WHERE id = ?`,
  clearAll: `DELETE FROM clipboard_entries`,
  toggleFavorite: `UPDATE clipboard_entries SET favorite = CASE WHEN favorite = 1 THEN 0 ELSE 1 END WHERE id = ?`,
  search: `SELECT * FROM clipboard_entries WHERE content LIKE ? ORDER BY created_at DESC LIMIT 100`,
  getLatest: `SELECT * FROM clipboard_entries ORDER BY created_at DESC LIMIT 1`,
  count: `SELECT COUNT(*) as count FROM clipboard_entries`,
  trimExcess: `DELETE FROM clipboard_entries WHERE id NOT IN (SELECT id FROM clipboard_entries ORDER BY created_at DESC LIMIT 200)`,
};

export const SETTINGS_QUERIES = {
  get: `SELECT value FROM settings WHERE key = ?`,
  set: `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
  getAll: `SELECT key, value FROM settings`,
  delete: `DELETE FROM settings WHERE key = ?`,
};

export const NOTIFICATION_QUERIES = {
  insert: `INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)`,
  getAll: `SELECT * FROM notifications ORDER BY created_at DESC`,
  getUnread: `SELECT * FROM notifications WHERE read = 0 ORDER BY created_at DESC`,
  markRead: `UPDATE notifications SET read = 1 WHERE id = ?`,
  markAllRead: `UPDATE notifications SET read = 1 WHERE read = 0`,
  delete: `DELETE FROM notifications WHERE id = ?`,
  deleteAll: `DELETE FROM notifications`,
  unreadCount: `SELECT COUNT(*) as count FROM notifications WHERE read = 0`,
};

export const PROJECT_QUERIES = {
  getAll: `SELECT * FROM projects ORDER BY updated_at DESC`,
  getById: `SELECT * FROM projects WHERE id = ?`,
  insert: `INSERT INTO projects (name, description, tags, technology, repository_url, local_path, enabled_modules) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  update: `UPDATE projects SET name = ?, description = ?, status = ?, tags = ?, technology = ?, favorite = ?, pinned = ?, repository_url = ?, local_path = ?, scripts = ?, environment = ?, enabled_modules = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  updateLastOpened: `UPDATE projects SET last_opened = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  toggleFavorite: `UPDATE projects SET favorite = CASE WHEN favorite = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  togglePinned: `UPDATE projects SET pinned = CASE WHEN pinned = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  delete: `DELETE FROM projects WHERE id = ?`,
  getRecent: `SELECT * FROM projects ORDER BY last_opened DESC NULLS LAST, updated_at DESC LIMIT ?`,
  getFavorites: `SELECT * FROM projects WHERE favorite = 1 ORDER BY updated_at DESC`,
  getPinned: `SELECT * FROM projects WHERE pinned = 1 ORDER BY updated_at DESC`,
  search: `SELECT * FROM projects WHERE name LIKE ? OR description LIKE ? ORDER BY updated_at DESC`,
  getByIdDesc: `SELECT * FROM projects ORDER BY id DESC LIMIT 1`,
};

export const ACTIVITY_QUERIES = {
  insert: `INSERT INTO recent_activity (entity_type, entity_id, action, description) VALUES (?, ?, ?, ?)`,
  getRecent: `SELECT * FROM recent_activity ORDER BY created_at DESC LIMIT ?`,
  getByEntity: `SELECT * FROM recent_activity WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC`,
  deleteOld: `DELETE FROM recent_activity WHERE created_at < datetime('now', '-30 days')`,
};

// ── Knowledge queries ──────────────────────────────────────────────────

export const NOTE_QUERIES = {
  getAll: `SELECT * FROM notes ORDER BY updated_at DESC`,
  getById: `SELECT * FROM notes WHERE id = ?`,
  getByFolder: `SELECT * FROM notes WHERE folder_id = ? ORDER BY updated_at DESC`,
  insert: `INSERT INTO notes (title, content, folder_id, tags, favorite, pinned, project_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  update: `UPDATE notes SET title = ?, content = ?, folder_id = ?, tags = ?, favorite = ?, pinned = ?, project_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  updateLastOpened: `UPDATE notes SET last_opened = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  toggleFavorite: `UPDATE notes SET favorite = CASE WHEN favorite = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  togglePinned: `UPDATE notes SET pinned = CASE WHEN pinned = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  delete: `DELETE FROM notes WHERE id = ?`,
  getFavorites: `SELECT * FROM notes WHERE favorite = 1 ORDER BY updated_at DESC`,
  getPinned: `SELECT * FROM notes WHERE pinned = 1 ORDER BY updated_at DESC`,
  getRecent: `SELECT * FROM notes ORDER BY last_opened DESC NULLS LAST, updated_at DESC LIMIT ?`,
  search: `SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY updated_at DESC`,
  searchFts: `SELECT n.* FROM notes n INNER JOIN notes_fts f ON n.id = f.rowid WHERE notes_fts MATCH ? ORDER BY rank`,
};

export const FOLDER_QUERIES = {
  getAll: `SELECT * FROM folders ORDER BY name ASC`,
  getById: `SELECT * FROM folders WHERE id = ?`,
  getChildren: `SELECT * FROM folders WHERE parent_id = ? ORDER BY name ASC`,
  getRoot: `SELECT * FROM folders WHERE parent_id IS NULL ORDER BY name ASC`,
  insert: `INSERT INTO folders (name, parent_id, icon) VALUES (?, ?, ?)`,
  update: `UPDATE folders SET name = ?, icon = ? WHERE id = ?`,
  delete: `DELETE FROM folders WHERE id = ?`,
};

export const SNIPPET_QUERIES = {
  getAll: `SELECT * FROM code_snippets ORDER BY updated_at DESC`,
  getById: `SELECT * FROM code_snippets WHERE id = ?`,
  getByLanguage: `SELECT * FROM code_snippets WHERE language = ? ORDER BY updated_at DESC`,
  insert: `INSERT INTO code_snippets (title, code, language, description, tags, favorite, project_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  update: `UPDATE code_snippets SET title = ?, code = ?, language = ?, description = ?, tags = ?, favorite = ?, project_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  toggleFavorite: `UPDATE code_snippets SET favorite = CASE WHEN favorite = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  delete: `DELETE FROM code_snippets WHERE id = ?`,
  getFavorites: `SELECT * FROM code_snippets WHERE favorite = 1 ORDER BY updated_at DESC`,
  search: `SELECT * FROM code_snippets WHERE title LIKE ? OR description LIKE ? OR code LIKE ? ORDER BY updated_at DESC`,
};

export const BUG_QUERIES = {
  getAll: `SELECT * FROM bugs ORDER BY updated_at DESC`,
  getById: `SELECT * FROM bugs WHERE id = ?`,
  getByProject: `SELECT * FROM bugs WHERE project_id = ? ORDER BY updated_at DESC`,
  insert: `INSERT INTO bugs (title, problem, solution, tags, project_id, status) VALUES (?, ?, ?, ?, ?, ?)`,
  update: `UPDATE bugs SET title = ?, problem = ?, solution = ?, tags = ?, project_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  delete: `DELETE FROM bugs WHERE id = ?`,
  search: `SELECT * FROM bugs WHERE title LIKE ? OR problem LIKE ? OR solution LIKE ? ORDER BY updated_at DESC`,
};

export const ATTACHMENT_QUERIES = {
  getByNote: `SELECT * FROM attachments WHERE note_id = ? ORDER BY created_at DESC`,
  insert: `INSERT INTO attachments (note_id, name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?)`,
  delete: `DELETE FROM attachments WHERE id = ?`,
};

export const WORKFLOW_QUERIES = {
  getAll: `SELECT * FROM workflows ORDER BY updated_at DESC`,
  getById: `SELECT * FROM workflows WHERE id = ?`,
  getByProject: `SELECT * FROM workflows WHERE project_id = ? ORDER BY updated_at DESC`,
  getGlobal: `SELECT * FROM workflows WHERE project_id IS NULL ORDER BY updated_at DESC`,
  insert: `INSERT INTO workflows (name, description, steps, tags, favorite, category, project_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  update: `UPDATE workflows SET name = ?, description = ?, steps = ?, tags = ?, favorite = ?, category = ?, project_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  updateLastRun: `UPDATE workflows SET last_run_at = CURRENT_TIMESTAMP, last_run_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  toggleFavorite: `UPDATE workflows SET favorite = CASE WHEN favorite = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  delete: `DELETE FROM workflows WHERE id = ?`,
  search: `SELECT * FROM workflows WHERE name LIKE ? OR description LIKE ? ORDER BY updated_at DESC`,
};

export const WORKFLOW_LOG_QUERIES = {
  getByWorkflow: `SELECT * FROM workflow_logs WHERE workflow_id = ? ORDER BY started_at DESC`,
  getById: `SELECT * FROM workflow_logs WHERE id = ?`,
  insert: `INSERT INTO workflow_logs (workflow_id, status, step_logs) VALUES (?, ?, ?)`,
  update: `UPDATE workflow_logs SET status = ?, step_logs = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
  delete: `DELETE FROM workflow_logs WHERE id = ?`,
  clearForWorkflow: `DELETE FROM workflow_logs WHERE workflow_id = ?`,
};

export const AI_CONVERSATION_QUERIES = {
  getAll: `SELECT * FROM ai_conversations ORDER BY updated_at DESC`,
  getById: `SELECT * FROM ai_conversations WHERE id = ?`,
  getByProject: `SELECT * FROM ai_conversations WHERE project_id = ? ORDER BY updated_at DESC`,
  insert: `INSERT INTO ai_conversations (title, provider, model, project_id) VALUES (?, ?, ?, ?)`,
  update: `UPDATE ai_conversations SET title = ?, provider = ?, model = ?, project_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  delete: `DELETE FROM ai_conversations WHERE id = ?`,
};

export const AI_MESSAGE_QUERIES = {
  getByConversation: `SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC`,
  insert: `INSERT INTO ai_messages (conversation_id, role, content, tool_calls) VALUES (?, ?, ?, ?)`,
  deleteByConversation: `DELETE FROM ai_messages WHERE conversation_id = ?`,
};

export const ANALYTICS_QUERIES = {
  getAll: `SELECT * FROM analytics_sessions ORDER BY created_at DESC`,
  getByDateRange: `SELECT * FROM analytics_sessions WHERE date >= ? AND date <= ? ORDER BY date ASC`,
  getToday: `SELECT * FROM analytics_sessions WHERE date = ? ORDER BY created_at ASC`,
  insert: `INSERT INTO analytics_sessions (date, duration_minutes, type, label) VALUES (?, ?, ?, ?)`,
  delete: `DELETE FROM analytics_sessions`,
};

export const INSIGHTS_ACTIVITY_QUERIES = {
  insert: `INSERT INTO activity_logs (project_id, type, description, started_at, ended_at, duration) VALUES (?, ?, ?, ?, ?, ?)`,
  getByRange: `SELECT * FROM activity_logs WHERE started_at >= ? AND started_at <= ? ORDER BY started_at DESC`,
  getToday: `SELECT * FROM activity_logs WHERE date(started_at) = date('now') ORDER BY started_at DESC`,
  getByProject: `SELECT * FROM activity_logs WHERE project_id = ? ORDER BY started_at DESC LIMIT ?`,
};

export const INSIGHTS_DAILY_QUERIES = {
  upsert: `INSERT INTO daily_stats (date, focus_time, projects, tasks, commits, notes, bugs) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(date) DO UPDATE SET focus_time = focus_time + excluded.focus_time, projects = projects + excluded.projects, tasks = tasks + excluded.tasks, commits = commits + excluded.commits, notes = notes + excluded.notes, bugs = bugs + excluded.bugs`,
  getByRange: `SELECT * FROM daily_stats WHERE date >= ? AND date <= ? ORDER BY date ASC`,
  getLatest: `SELECT * FROM daily_stats ORDER BY date DESC LIMIT ?`,
};

export const INSIGHTS_PROJECT_STATS_QUERIES = {
  upsert: `INSERT INTO project_stats (project_id, total_time, last_opened, commits, notes, bugs) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(project_id) DO UPDATE SET total_time = total_time + excluded.total_time, last_opened = excluded.last_opened, commits = commits + excluded.commits, notes = notes + excluded.notes, bugs = bugs + excluded.bugs`,
  getAll: `SELECT ps.*, p.name, p.status FROM project_stats ps JOIN projects p ON ps.project_id = p.id ORDER BY ps.total_time DESC`,
  getByProject: `SELECT * FROM project_stats WHERE project_id = ?`,
};

export const INSIGHTS_GOAL_QUERIES = {
  getAll: `SELECT * FROM goals ORDER BY status ASC, created_at DESC`,
  getActive: `SELECT * FROM goals WHERE status = 'active' ORDER BY created_at DESC`,
  insert: `INSERT INTO goals (title, target, progress, deadline, status) VALUES (?, ?, ?, ?, ?)`,
  update: `UPDATE goals SET title = ?, target = ?, progress = ?, deadline = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  updateProgress: `UPDATE goals SET progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  delete: `DELETE FROM goals WHERE id = ?`,
};

export const BACKUP_QUERIES = {
  getAll: `SELECT * FROM backups ORDER BY created_at DESC`,
  getById: `SELECT * FROM backups WHERE id = ?`,
  insert: `INSERT INTO backups (filename, size_bytes, type, encrypted, notes) VALUES (?, ?, ?, ?, ?)`,
  delete: `DELETE FROM backups WHERE id = ?`,
  deleteAll: `DELETE FROM backups`,
};

export const USER_QUERIES = {
  getAll: `SELECT * FROM users`,
  getById: `SELECT * FROM users WHERE id = ?`,
  getByEmail: `SELECT * FROM users WHERE email = ?`,
  insert: `INSERT INTO users (id, name, email, role, permissions, business_modules, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  update: `UPDATE users SET name = ?, email = ?, role = ?, permissions = ?, business_modules = ?, avatar = ? WHERE id = ?`,
  delete: `DELETE FROM users WHERE id = ?`,
};

export const PROJECT_PATH_QUERIES = {
  getByProject: `SELECT * FROM project_paths WHERE project_id = ?`,
  insert: `INSERT INTO project_paths (project_id, path, type) VALUES (?, ?, ?)`,
  delete: `DELETE FROM project_paths WHERE id = ?`,
  deleteByProject: `DELETE FROM project_paths WHERE project_id = ?`,
};

export const PROJECT_SCRIPT_QUERIES = {
  getByProject: `SELECT * FROM project_scripts WHERE project_id = ?`,
  insert: `INSERT INTO project_scripts (project_id, name, command) VALUES (?, ?, ?)`,
  delete: `DELETE FROM project_scripts WHERE id = ?`,
  deleteByProject: `DELETE FROM project_scripts WHERE project_id = ?`,
};

export const PROJECT_LINK_QUERIES = {
  getByProject: `SELECT * FROM project_links WHERE project_id = ?`,
  insert: `INSERT INTO project_links (project_id, type, url) VALUES (?, ?, ?)`,
  delete: `DELETE FROM project_links WHERE id = ?`,
  deleteByProject: `DELETE FROM project_links WHERE project_id = ?`,
};

export const PROJECT_TASK_QUERIES = {
  getAll: `SELECT pt.*, p.name as project_name, p.color as project_color, p.local_path as project_path FROM project_tasks pt LEFT JOIN projects p ON pt.project_id = p.id ORDER BY pt.created_at DESC`,
  getByProject: `SELECT pt.*, p.name as project_name, p.color as project_color FROM project_tasks pt LEFT JOIN projects p ON pt.project_id = p.id WHERE pt.project_id = ? ORDER BY pt.created_at DESC`,
  getPending: `SELECT pt.*, p.name as project_name, p.color as project_color FROM project_tasks pt LEFT JOIN projects p ON pt.project_id = p.id WHERE pt.status != 'done' AND (pt.due_date IS NULL OR pt.due_date <= datetime('now', '+7 days')) ORDER BY pt.due_date ASC, pt.priority DESC`,
  getOverdue: `SELECT pt.*, p.name as project_name, p.color as project_color FROM project_tasks pt LEFT JOIN projects p ON pt.project_id = p.id WHERE pt.status != 'done' AND pt.due_date < datetime('now', 'start of day') ORDER BY pt.due_date ASC`,
  getToday: `SELECT pt.*, p.name as project_name, p.color as project_color FROM project_tasks pt LEFT JOIN projects p ON pt.project_id = p.id WHERE pt.due_date = datetime('now', 'start of day') OR (pt.status != 'done' AND pt.due_date IS NULL) ORDER BY pt.priority DESC, pt.created_at DESC`,
  insert: `INSERT INTO project_tasks (project_id, title, description, priority, status, due_date) VALUES (?, ?, ?, ?, ?, ?)`,
  update: `UPDATE project_tasks SET title = ?, description = ?, priority = ?, status = ?, due_date = ? WHERE id = ?`,
  delete: `DELETE FROM project_tasks WHERE id = ?`,
  deleteByProject: `DELETE FROM project_tasks WHERE project_id = ?`,
};

export const PROJECT_ACTIVITY_QUERIES = {
  getByProject: `SELECT * FROM project_activity WHERE project_id = ? ORDER BY created_at DESC LIMIT ?`,
  insert: `INSERT INTO project_activity (project_id, title, type) VALUES (?, ?, ?)`,
  deleteByProject: `DELETE FROM project_activity WHERE project_id = ?`,
};

// ── Unified Knowledge queries ──────────────────────────────────────────

const ACTIVE = `status != 'trashed'`;
const BASE_ORDER = `ORDER BY pinned DESC, updated_at DESC`;

const SELECT = `SELECT * FROM knowledge_items WHERE ${ACTIVE}`;
const SELECT_ALL = `${SELECT} ${BASE_ORDER}`;

export const KNOWLEDGE_QUERIES = {
  getAll: `${SELECT_ALL}`,
  getById: `SELECT * FROM knowledge_items WHERE id = ?`,
  getByType: (type: string) => `${SELECT} AND type = '${type}' ${BASE_ORDER}`,
  getByProject: `SELECT * FROM knowledge_items WHERE project_id = ? AND ${ACTIVE} ${BASE_ORDER}`,
  getFavorites: `${SELECT} AND favorite = 1 ${BASE_ORDER}`,
  getRecent: `${SELECT} ${BASE_ORDER} LIMIT ?`,
  getTrashed: `SELECT * FROM knowledge_items WHERE status = 'trashed' ORDER BY updated_at DESC`,
  search: `SELECT * FROM knowledge_items WHERE ${ACTIVE} AND (title LIKE ? OR content LIKE ? OR description LIKE ? OR tags LIKE ?) ORDER BY CASE WHEN title LIKE ? THEN 0 ELSE 1 END, updated_at DESC`,
  insert: `INSERT INTO knowledge_items (title, type, content, description, language, url, problem, cause, solution, severity, category, tags, favorite, pinned, status, project_id, folder_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  update: `UPDATE knowledge_items SET title = ?, content = ?, description = ?, language = ?, url = ?, problem = ?, cause = ?, solution = ?, severity = ?, category = ?, tags = ?, favorite = ?, pinned = ?, status = ?, project_id = ?, folder_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  toggleFavorite: `UPDATE knowledge_items SET favorite = CASE WHEN favorite = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  togglePinned: `UPDATE knowledge_items SET pinned = CASE WHEN pinned = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  updateLastOpened: `UPDATE knowledge_items SET last_opened = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  softDelete: `UPDATE knowledge_items SET status = 'trashed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  hardDelete: `DELETE FROM knowledge_items WHERE id = ?`,
  emptyTrash: `DELETE FROM knowledge_items WHERE status = 'trashed'`,
  restore: `UPDATE knowledge_items SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  countByType: (type: string) => `SELECT COUNT(*) as count FROM knowledge_items WHERE type = '${type}' AND status != 'trashed'`,
};

export const RELATION_QUERIES = {
  getBySource: `SELECT * FROM relations WHERE source_id = ?`,
  getByTarget: `SELECT * FROM relations WHERE target_id = ?`,
  getRelated: `SELECT k.* FROM knowledge_items k INNER JOIN relations r ON (r.target_id = k.id OR r.source_id = k.id) WHERE (r.source_id = ? OR r.target_id = ?) AND k.id != ? AND ${ACTIVE} LIMIT 10`,
  insert: `INSERT INTO relations (source_id, target_id, relation_type) VALUES (?, ?, ?)`,
  delete: `DELETE FROM relations WHERE id = ?`,
  deletePair: `DELETE FROM relations WHERE (source_id = ? AND target_id = ?) OR (source_id = ? AND target_id = ?)`,
};

export const KNOWLEDGE_FOLDER_QUERIES = {
  getAll: `SELECT * FROM knowledge_folders ORDER BY name ASC`,
  getById: `SELECT * FROM knowledge_folders WHERE id = ?`,
  getChildren: `SELECT * FROM knowledge_folders WHERE parent_id = ? ORDER BY name ASC`,
  getRoot: `SELECT * FROM knowledge_folders WHERE parent_id IS NULL ORDER BY name ASC`,
  insert: `INSERT INTO knowledge_folders (name, parent_id) VALUES (?, ?)`,
  update: `UPDATE knowledge_folders SET name = ? WHERE id = ?`,
  delete: `DELETE FROM knowledge_folders WHERE id = ?`,
};

export const TOOL_QUERIES = {
  getAll: `SELECT * FROM tools ORDER BY favorite DESC, name ASC`,
  getByCategory: `SELECT * FROM tools WHERE category = ? ORDER BY name ASC`,
  getFavorites: `SELECT * FROM tools WHERE favorite = 1 ORDER BY name ASC`,
  insert: `INSERT INTO tools (name, category, description, icon) VALUES (?, ?, ?, ?)`,
  toggleFavorite: `UPDATE tools SET favorite = CASE WHEN favorite = 1 THEN 0 ELSE 1 END WHERE id = ?`,
  delete: `DELETE FROM tools WHERE id = ?`,
};

export const RECENT_TOOL_QUERIES = {
  getRecent: `SELECT t.*, r.used_at FROM tools t INNER JOIN recent_tools r ON t.id = r.tool_id ORDER BY r.used_at DESC LIMIT ?`,
  insert: `INSERT INTO recent_tools (tool_id) VALUES (?)`,
  updateTimestamp: `UPDATE recent_tools SET used_at = CURRENT_TIMESTAMP WHERE tool_id = ?`,
  getByToolId: `SELECT * FROM recent_tools WHERE tool_id = ?`,
  cleanOld: `DELETE FROM recent_tools WHERE id NOT IN (SELECT id FROM recent_tools ORDER BY used_at DESC LIMIT 50)`,
};

export const DEPLOYMENT_QUERIES = {
  getAll: `SELECT * FROM deployments ORDER BY created_at DESC`,
  getByProject: `SELECT * FROM deployments WHERE project_id = ? ORDER BY created_at DESC`,
  insert: `INSERT INTO deployments (project_id, name, provider, url, build_command, branch, auto_deploy, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  update: `UPDATE deployments SET name = ?, provider = ?, url = ?, build_command = ?, branch = ?, auto_deploy = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  updateStatus: `UPDATE deployments SET status = ?, last_deployed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  delete: `DELETE FROM deployments WHERE id = ?`,
  deleteByProject: `DELETE FROM deployments WHERE project_id = ?`,
};

export const DEPLOYMENT_LOG_QUERIES = {
  getByDeployment: `SELECT * FROM deployment_logs WHERE deployment_id = ? ORDER BY created_at DESC`,
  insert: `INSERT INTO deployment_logs (deployment_id, status, output, started_at, completed_at) VALUES (?, ?, ?, ?, ?)`,
  deleteByDeployment: `DELETE FROM deployment_logs WHERE deployment_id = ?`,
};

export const TOOL_SETTINGS_QUERIES = {
  getByToolId: `SELECT * FROM tool_settings WHERE tool_id = ?`,
  upsert: `INSERT INTO tool_settings (tool_id, settings_json) VALUES (?, ?) ON CONFLICT(tool_id) DO UPDATE SET settings_json = excluded.settings_json`,
};
