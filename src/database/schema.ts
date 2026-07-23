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
  tags TEXT DEFAULT '[]',
  technology TEXT DEFAULT '[]',
  favorite INTEGER DEFAULT 0,
  pinned INTEGER DEFAULT 0,
  repository_url TEXT DEFAULT '',
  local_path TEXT DEFAULT '',
  scripts TEXT DEFAULT '{}',
  environment TEXT DEFAULT '{}',
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

export const NOTES_FTS_TABLE = `CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
  title, content, tags, content='notes', content_rowid='id'
);`;

export const NOTES_FTS_TRIGGER_INSERT = `CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
  INSERT INTO notes_fts(rowid, title, content, tags) VALUES (new.id, new.title, new.content, new.tags);
END;`;

export const NOTES_FTS_TRIGGER_DELETE = `CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid, title, content, tags) VALUES('delete', old.id, old.title, old.content, old.tags);
END;`;

export const NOTES_FTS_TRIGGER_UPDATE = `CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid, title, content, tags) VALUES('delete', old.id, old.title, old.content, old.tags);
  INSERT INTO notes_fts(rowid, title, content, tags) VALUES (new.id, new.title, new.content, new.tags);
END;`;

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
  // FTS - will silently fail in localStorage mode
  NOTES_FTS_TABLE,
  NOTES_FTS_TRIGGER_INSERT,
  NOTES_FTS_TRIGGER_DELETE,
  NOTES_FTS_TRIGGER_UPDATE,
];

// ── Query constants ────────────────────────────────────────────────────

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
  insert: `INSERT INTO projects (name, description, tags, technology, repository_url, local_path) VALUES (?, ?, ?, ?, ?, ?)`,
  update: `UPDATE projects SET name = ?, description = ?, status = ?, tags = ?, technology = ?, favorite = ?, pinned = ?, repository_url = ?, local_path = ?, scripts = ?, environment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  updateLastOpened: `UPDATE projects SET last_opened = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  toggleFavorite: `UPDATE projects SET favorite = CASE WHEN favorite = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  togglePinned: `UPDATE projects SET pinned = CASE WHEN pinned = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  delete: `DELETE FROM projects WHERE id = ?`,
  getRecent: `SELECT * FROM projects ORDER BY last_opened DESC NULLS LAST, updated_at DESC LIMIT ?`,
  getFavorites: `SELECT * FROM projects WHERE favorite = 1 ORDER BY updated_at DESC`,
  getPinned: `SELECT * FROM projects WHERE pinned = 1 ORDER BY updated_at DESC`,
  search: `SELECT * FROM projects WHERE name LIKE ? OR description LIKE ? ORDER BY updated_at DESC`,
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
  insert: `INSERT INTO workflows (name, description, steps, tags, favorite, category) VALUES (?, ?, ?, ?, ?, ?)`,
  update: `UPDATE workflows SET name = ?, description = ?, steps = ?, tags = ?, favorite = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
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
  insert: `INSERT INTO ai_conversations (title, provider, model) VALUES (?, ?, ?)`,
  update: `UPDATE ai_conversations SET title = ?, provider = ?, model = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
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
