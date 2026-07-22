import {
  ALL_MIGRATIONS,
  SETTINGS_QUERIES,
  NOTIFICATION_QUERIES,
  PROJECT_QUERIES,
  NOTE_QUERIES,
  ACTIVITY_QUERIES,
} from './schema';

type Row = Record<string, unknown>;
type DatabaseInstance = {
  execute: (sql: string, bind?: unknown[]) => Promise<unknown>;
  select: <T = Row>(sql: string, bind?: unknown[]) => Promise<T[]>;
};

let db: DatabaseInstance | null = null;
let useLocalFallback = false;

// ── localStorage fallback ───────────────────────────────────────────
function lsGet<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function lsSet(key: string, data: unknown[]) {
  localStorage.setItem(key, JSON.stringify(data));
}
function nextId(rows: { id?: number }[]): number {
  return rows.length ? Math.max(...rows.map((r) => r.id ?? 0)) + 1 : 1;
}

class LocalDatabase {
  async execute(_sql: string, bind?: unknown[]): Promise<void> {
    const sql = _sql.trim().toUpperCase();
    // Settings
    if (sql.startsWith('INSERT OR REPLACE INTO SETTINGS')) {
      const rows = lsGet<Row>('_db_settings');
      const idx = rows.findIndex((r) => r.key === bind?.[0]);
      const entry = { key: bind?.[0], value: bind?.[1], updated_at: new Date().toISOString() };
      idx >= 0 ? (rows[idx] = entry) : rows.push(entry);
      lsSet('_db_settings', rows);
      return;
    }
    if (sql.startsWith('DELETE FROM SETTINGS')) {
      if (bind?.length) lsSet('_db_settings', lsGet<Row>('_db_settings').filter((r) => r.key !== bind[0]));
      else lsSet('_db_settings', []);
      return;
    }
    // Notifications
    if (sql.startsWith('INSERT INTO NOTIFICATIONS')) {
      const rows = lsGet<Row>('_db_notifications');
      rows.push({ id: nextId(rows as { id?: number }[]), title: bind?.[0], message: bind?.[1], type: bind?.[2], read: 0, created_at: new Date().toISOString() });
      lsSet('_db_notifications', rows);
      return;
    }
    if (sql.startsWith('UPDATE NOTIFICATIONS SET READ = 1 WHERE ID = ?')) {
      const rows = lsGet<Row>('_db_notifications');
      const found = rows.find((r) => r.id === bind?.[0]);
      if (found) found.read = 1;
      lsSet('_db_notifications', rows);
      return;
    }
    if (sql.startsWith('UPDATE NOTIFICATIONS SET READ = 1')) {
      lsSet('_db_notifications', lsGet<Row>('_db_notifications').map((r) => ({ ...r, read: 1 })));
      return;
    }
    if (sql.startsWith('DELETE FROM NOTIFICATIONS WHERE ID = ?')) {
      lsSet('_db_notifications', lsGet<Row>('_db_notifications').filter((r) => r.id !== bind?.[0]));
      return;
    }
    if (sql.startsWith('DELETE FROM NOTIFICATIONS')) {
      lsSet('_db_notifications', []);
      return;
    }
    // Projects
    if (sql.startsWith('INSERT INTO PROJECTS')) {
      const rows = lsGet<Row>('_db_projects');
      rows.push({ id: nextId(rows as { id?: number }[]), name: bind?.[0], description: bind?.[1] ?? '', status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      lsSet('_db_projects', rows);
      return;
    }
    // Notes
    if (sql.startsWith('INSERT INTO NOTES')) {
      const rows = lsGet<Row>('_db_notes');
      rows.push({ id: nextId(rows as { id?: number }[]), title: bind?.[0], content: bind?.[1] ?? '', project_id: bind?.[2] ?? null, starred: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      lsSet('_db_notes', rows);
      return;
    }
    // Activity
    if (sql.startsWith('INSERT INTO RECENT_ACTIVITY')) {
      const rows = lsGet<Row>('_db_activity');
      rows.push({ id: nextId(rows as { id?: number }[]), entity_type: bind?.[0], entity_id: bind?.[1], action: bind?.[2], description: bind?.[3], created_at: new Date().toISOString() });
      lsSet('_db_activity', rows);
      return;
    }
    // Generic CREATE TABLE IF NOT EXISTS
    if (sql.includes('CREATE TABLE IF NOT EXISTS')) return;
  }

  async select<T = Row>(_sql: string, bind?: unknown[]): Promise<T[]> {
    const sql = _sql.trim().toUpperCase();
    if (sql.startsWith('SELECT VALUE FROM SETTINGS')) {
      const rows = lsGet<Row>('_db_settings');
      return rows.filter((r) => r.key === bind?.[0]) as T[];
    }
    if (sql.startsWith('SELECT KEY, VALUE FROM SETTINGS')) {
      return lsGet<Row>('_db_settings') as T[];
    }
    if (sql.startsWith('SELECT * FROM NOTIFICATIONS ORDER BY CREATED_AT DESC')) {
      return lsGet<Row>('_db_notifications').sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))) as T[];
    }
    if (sql.startsWith('SELECT * FROM NOTIFICATIONS WHERE READ = 0')) {
      return lsGet<Row>('_db_notifications').filter((r) => r.read === 0).sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))) as T[];
    }
    if (sql.startsWith('SELECT COUNT(*) AS COUNT FROM NOTIFICATIONS')) {
      const count = lsGet<Row>('_db_notifications').filter((r) => r.read === 0).length;
      return [{ count }] as T[];
    }
    if (sql.startsWith('SELECT * FROM PROJECTS ORDER BY UPDATED_AT DESC')) {
      const rows = lsGet<Row>('_db_projects').sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')));
      return bind?.length ? rows.slice(0, bind[0] as number) as T[] : rows as T[];
    }
    if (sql.startsWith('SELECT * FROM NOTES ORDER BY UPDATED_AT DESC')) {
      const rows = lsGet<Row>('_db_notes').sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')));
      return bind?.length ? rows.slice(0, bind[0] as number) as T[] : rows as T[];
    }
    if (sql.startsWith('SELECT * FROM RECENT_ACTIVITY ORDER BY CREATED_AT DESC')) {
      const rows = lsGet<Row>('_db_activity').sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
      return bind?.length ? rows.slice(0, bind[0] as number) as T[] : rows as T[];
    }
    return [];
  }
}

// ── Database resolution ──────────────────────────────────────────────
async function getDatabase(): Promise<DatabaseInstance | null> {
  if (db) return db;

  // Try Tauri SQLite first
  try {
    const Database = (await import('@tauri-apps/plugin-sql')).default;
    db = await Database.load('sqlite:developer_os.db');
    return db;
  } catch {
    // Fall back to localStorage
    if (!useLocalFallback) {
      useLocalFallback = true;
      console.log('[DB] Using localStorage fallback (Tauri SQLite unavailable)');
    }
    db = new LocalDatabase();
    return db;
  }
}

async function runMigrations(): Promise<void> {
  const instance = await getDatabase();
  if (!instance) return;
  for (const sql of ALL_MIGRATIONS) {
    try { await instance.execute(sql); } catch { /* skip */ }
  }
}

export const database = {
  initialize: runMigrations,

  async getSetting(key: string): Promise<string | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    const rows = await inst.select<{ value: string }>(SETTINGS_QUERIES.get, [key]);
    return rows.length > 0 ? rows[0].value : null;
  },

  async setSetting(key: string, value: string): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(SETTINGS_QUERIES.set, [key, value]);
  },

  async getAllSettings(): Promise<{ key: string; value: string }[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(SETTINGS_QUERIES.getAll);
  },

  async addNotification(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error'): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(NOTIFICATION_QUERIES.insert, [title, message, type]);
  },

  async getNotifications() {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(NOTIFICATION_QUERIES.getAll);
  },

  async markNotificationRead(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(NOTIFICATION_QUERIES.markRead, [id]);
  },

  async markAllNotificationsRead(): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(NOTIFICATION_QUERIES.markAllRead);
  },

  async getUnreadCount(): Promise<number> {
    const inst = await getDatabase();
    if (!inst) return 0;
    const rows = await inst.select<{ count: number }>(NOTIFICATION_QUERIES.unreadCount);
    return rows[0]?.count ?? 0;
  },

  async getProjects() {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(PROJECT_QUERIES.getAll);
  },

  async getRecentProjects(limit = 5) {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(PROJECT_QUERIES.getRecent, [limit]);
  },

  async createProject(name: string, description = '') {
    const inst = await getDatabase();
    if (!inst) return null;
    await inst.execute(PROJECT_QUERIES.insert, [name, description]);
    const rows = await inst.select(PROJECT_QUERIES.getRecent, [1]);
    return rows[0] ?? null;
  },

  async getRecentNotes(limit = 5) {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(NOTE_QUERIES.getRecent, [limit]);
  },

  async createNote(title: string, content = '', projectId: number | null = null) {
    const inst = await getDatabase();
    if (!inst) return null;
    await inst.execute(NOTE_QUERIES.insert, [title, content, projectId]);
    const rows = await inst.select(NOTE_QUERIES.getRecent, [1]);
    return rows[0] ?? null;
  },

  async addActivity(entityType: string, entityId: number | null, action: string, description: string): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(ACTIVITY_QUERIES.insert, [entityType, entityId, action, description]);
  },

  async getRecentActivity(limit = 10) {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(ACTIVITY_QUERIES.getRecent, [limit]);
  },
};
