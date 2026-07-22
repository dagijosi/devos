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
  project_id INTEGER,
  starred INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);`;

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

export const ALL_MIGRATIONS = [
  SETTINGS_TABLE,
  NOTIFICATIONS_TABLE,
  PROJECTS_TABLE,
  NOTES_TABLE,
  RECENT_ACTIVITY_TABLE,
  TAGS_TABLE,
];

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
