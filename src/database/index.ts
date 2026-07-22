import {
  ALL_MIGRATIONS,
  SETTINGS_QUERIES,
  NOTIFICATION_QUERIES,
  PROJECT_QUERIES,
  ACTIVITY_QUERIES,
} from './schema';
import type { Project } from '../features/projects/types';

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

function parseProject(row: Row): Project {
  return {
    ...row,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags as string) : row.tags ?? [],
    technology: typeof row.technology === 'string' ? JSON.parse(row.technology as string) : row.technology ?? [],
    scripts: typeof row.scripts === 'string' ? JSON.parse(row.scripts as string) : row.scripts ?? {},
    environment: typeof row.environment === 'string' ? JSON.parse(row.environment as string) : row.environment ?? {},
    favorite: Boolean(row.favorite),
    pinned: Boolean(row.pinned),
  } as Project;
}

function sortBy<T>(rows: T[], key: keyof T, dir: 'asc' | 'desc' = 'desc'): T[] {
  return [...rows].sort((a, b) => {
    const va = String(a[key] ?? '');
    const vb = String(b[key] ?? '');
    return dir === 'desc' ? vb.localeCompare(va) : va.localeCompare(vb);
  });
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
    // Projects
    if (sql.startsWith('INSERT INTO PROJECTS')) {
      const rows = lsGet<Row>('_db_projects');
      rows.push({
        id: nextId(rows as { id?: number }[]),
        name: bind?.[0] ?? '',
        description: bind?.[1] ?? '',
        tags: bind?.[2] ?? '[]',
        technology: bind?.[3] ?? '[]',
        repository_url: bind?.[4] ?? '',
        local_path: bind?.[5] ?? '',
        status: 'active',
        favorite: 0, pinned: 0,
        scripts: '{}', environment: '{}',
        last_opened: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      lsSet('_db_projects', rows);
      return;
    }
    if (sql.startsWith('UPDATE PROJECTS SET NAME = ?')) {
      const rows = lsGet<Row>('_db_projects');
      const id = bind?.[11]; // last bind is WHERE id = ?
      const found = rows.find((r) => r.id === id);
      if (found) {
        found.name = bind?.[0];
        found.description = bind?.[1];
        found.status = bind?.[2];
        found.tags = bind?.[3];
        found.technology = bind?.[4];
        found.favorite = bind?.[5];
        found.pinned = bind?.[6];
        found.repository_url = bind?.[7];
        found.local_path = bind?.[8];
        found.scripts = bind?.[9];
        found.environment = bind?.[10];
        found.updated_at = new Date().toISOString();
      }
      lsSet('_db_projects', rows);
      return;
    }
    if (sql.includes('SET LAST_OPENED')) {
      const rows = lsGet<Row>('_db_projects');
      const found = rows.find((r) => r.id === bind?.[0]);
      if (found) { found.last_opened = new Date().toISOString(); found.updated_at = new Date().toISOString(); }
      lsSet('_db_projects', rows);
      return;
    }
    if (sql.includes('SET FAVORITE = CASE')) {
      const rows = lsGet<Row>('_db_projects');
      const found = rows.find((r) => r.id === bind?.[0]);
      if (found) { found.favorite = found.favorite === 1 ? 0 : 1; found.updated_at = new Date().toISOString(); }
      lsSet('_db_projects', rows);
      return;
    }
    if (sql.includes('SET PINNED = CASE')) {
      const rows = lsGet<Row>('_db_projects');
      const found = rows.find((r) => r.id === bind?.[0]);
      if (found) { found.pinned = found.pinned === 1 ? 0 : 1; found.updated_at = new Date().toISOString(); }
      lsSet('_db_projects', rows);
      return;
    }
    if (sql.startsWith('DELETE FROM PROJECTS')) {
      if (bind?.length) lsSet('_db_projects', lsGet<Row>('_db_projects').filter((r) => r.id !== bind[0]));
      else lsSet('_db_projects', []);
      return;
    }
    if (sql.startsWith('DELETE FROM NOTIFICATIONS')) {
      lsSet('_db_notifications', []);
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
    // Tags
    if (sql.startsWith('INSERT INTO TAGS')) {
      const rows = lsGet<Row>('_db_tags');
      const existing = rows.find((r) => String(r.name).toLowerCase() === String(bind?.[0] ?? '').toLowerCase());
      if (!existing) rows.push({ id: nextId(rows as { id?: number }[]), name: bind?.[0], color: bind?.[1] ?? '#6366f1', created_at: new Date().toISOString() });
      lsSet('_db_tags', rows);
      return;
    }
    // Generic CREATE TABLE IF NOT EXISTS / ALTER
    if (sql.includes('CREATE TABLE IF NOT EXISTS') || sql.startsWith('ALTER')) return;
  }

  async select<T = Row>(_sql: string, bind?: unknown[]): Promise<T[]> {
    const sql = _sql.trim().toUpperCase();

    // Settings
    if (sql.startsWith('SELECT VALUE FROM SETTINGS')) {
      return lsGet<Row>('_db_settings').filter((r) => r.key === bind?.[0]) as T[];
    }
    if (sql.startsWith('SELECT KEY, VALUE FROM SETTINGS')) {
      return lsGet<Row>('_db_settings') as T[];
    }
    // Notifications
    if (sql.startsWith('SELECT * FROM NOTIFICATIONS ORDER BY CREATED_AT DESC')) {
      return sortBy(lsGet<Row>('_db_notifications'), 'created_at') as T[];
    }
    if (sql.startsWith('SELECT * FROM NOTIFICATIONS WHERE READ = 0')) {
      return sortBy(lsGet<Row>('_db_notifications').filter((r) => r.read === 0), 'created_at') as T[];
    }
    if (sql.startsWith('SELECT COUNT(*) AS COUNT FROM NOTIFICATIONS')) {
      return [{ count: lsGet<Row>('_db_notifications').filter((r) => r.read === 0).length }] as T[];
    }
    // Projects
    if (sql.startsWith('SELECT * FROM PROJECTS WHERE FAVORITE = 1')) {
      return lsGet<Row>('_db_projects').filter((r) => r.favorite === 1).map(parseProject) as T[];
    }
    if (sql.startsWith('SELECT * FROM PROJECTS WHERE PINNED = 1')) {
      return lsGet<Row>('_db_projects').filter((r) => r.pinned === 1).map(parseProject) as T[];
    }
    if (sql.startsWith('SELECT * FROM PROJECTS WHERE ID = ?')) {
      const found = lsGet<Row>('_db_projects').find((r) => r.id === bind?.[0]);
      return (found ? [parseProject(found)] : []) as T[];
    }
    if (sql.startsWith('SELECT * FROM PROJECTS WHERE NAME LIKE ?')) {
      const q = String(bind?.[0] ?? '').replace(/%/g, '').toLowerCase();
      return lsGet<Row>('_db_projects').filter((r) => String(r.name).toLowerCase().includes(q) || String(r.description).toLowerCase().includes(q)).map(parseProject) as T[];
    }
    if (sql.startsWith('SELECT * FROM PROJECTS ORDER BY LAST_OPENED DESC')) {
      const rows = lsGet<Row>('_db_projects').sort((a, b) => {
        const la = a.last_opened ? new Date(String(a.last_opened)).getTime() : 0;
        const lb = b.last_opened ? new Date(String(b.last_opened)).getTime() : 0;
        return lb - la || String(b.updated_at).localeCompare(String(a.updated_at));
      });
      return (bind?.length ? rows.slice(0, bind[0] as number) : rows).map(parseProject) as T[];
    }
    if (sql.startsWith('SELECT * FROM PROJECTS ORDER BY UPDATED_AT DESC')) {
      const rows = sortBy(lsGet<Row>('_db_projects'), 'updated_at');
      return (bind?.length ? rows.slice(0, bind[0] as number) : rows).map(parseProject) as T[];
    }
    // Notes
    if (sql.startsWith('SELECT * FROM NOTES ORDER BY UPDATED_AT DESC')) {
      const rows = sortBy(lsGet<Row>('_db_notes'), 'updated_at');
      return (bind?.length ? rows.slice(0, bind[0] as number) : rows) as T[];
    }
    // Activity
    if (sql.startsWith('SELECT * FROM RECENT_ACTIVITY WHERE ENTITY_TYPE = ? AND ENTITY_ID = ?')) {
      return sortBy(lsGet<Row>('_db_activity').filter((r) => r.entity_type === bind?.[0] && r.entity_id === bind?.[1]), 'created_at') as T[];
    }
    if (sql.startsWith('SELECT * FROM RECENT_ACTIVITY ORDER BY CREATED_AT DESC')) {
      const rows = sortBy(lsGet<Row>('_db_activity'), 'created_at');
      return (bind?.length ? rows.slice(0, bind[0] as number) : rows) as T[];
    }
    // Tags
    if (sql.startsWith('SELECT * FROM TAGS')) {
      return lsGet<Row>('_db_tags') as T[];
    }
    return [];
  }
}

// ── Database resolution ──────────────────────────────────────────────
async function getDatabase(): Promise<DatabaseInstance | null> {
  if (db) return db;
  try {
    const Database = (await import('@tauri-apps/plugin-sql')).default;
    db = await Database.load('sqlite:developer_os.db');
    return db;
  } catch {
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

function toProject(row: Row): Project {
  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    description: String(row.description ?? ''),
    status: (row.status as Project['status']) ?? 'active',
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags as string) : row.tags ?? [],
    technology: typeof row.technology === 'string' ? JSON.parse(row.technology as string) : row.technology ?? [],
    favorite: Boolean(row.favorite),
    pinned: Boolean(row.pinned),
    repository_url: String(row.repository_url ?? ''),
    local_path: String(row.local_path ?? ''),
    scripts: typeof row.scripts === 'string' ? JSON.parse(row.scripts as string) : row.scripts ?? {},
    environment: typeof row.environment === 'string' ? JSON.parse(row.environment as string) : row.environment ?? {},
    last_opened: row.last_opened ? String(row.last_opened) : null,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
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

  // ── Projects ──────────────────────────────────────────────────────
  async getProjects(): Promise<Project[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(PROJECT_QUERIES.getAll);
    return rows.map(toProject);
  },

  async getProject(id: number): Promise<Project | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    const rows = await inst.select<Row>(PROJECT_QUERIES.getById, [id]);
    return rows.length ? toProject(rows[0]) : null;
  },

  async createProject(data: { name: string; description?: string; tags?: string; technology?: string; repository_url?: string; local_path?: string }): Promise<Project | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    await inst.execute(PROJECT_QUERIES.insert, [
      data.name, data.description ?? '',
      data.tags ?? '[]', data.technology ?? '[]',
      data.repository_url ?? '', data.local_path ?? '',
    ]);
    const rows = await inst.select<Row>(PROJECT_QUERIES.getAll);
    return rows.length ? toProject(rows[0]) : null;
  },

  async updateProject(id: number, data: Partial<Project>): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    const existing = await this.getProject(id);
    if (!existing) return;
    const merged = { ...existing, ...data };
    await inst.execute(PROJECT_QUERIES.update, [
      merged.name, merged.description, merged.status,
      JSON.stringify(merged.tags), JSON.stringify(merged.technology),
      merged.favorite ? 1 : 0, merged.pinned ? 1 : 0,
      merged.repository_url, merged.local_path,
      JSON.stringify(merged.scripts), JSON.stringify(merged.environment),
      id,
    ]);
  },

  async deleteProject(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(PROJECT_QUERIES.delete, [id]);
  },

  async getRecentProjects(limit = 5): Promise<Project[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(PROJECT_QUERIES.getRecent, [limit]);
    return rows.map(toProject);
  },

  async getPinnedProjects(): Promise<Project[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(PROJECT_QUERIES.getPinned);
    return rows.map(toProject);
  },

  async getFavoriteProjects(): Promise<Project[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(PROJECT_QUERIES.getFavorites);
    return rows.map(toProject);
  },

  async searchProjects(query: string): Promise<Project[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(PROJECT_QUERIES.search, [`%${query}%`, `%${query}%`]);
    return rows.map(toProject);
  },

  async updateLastOpened(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(PROJECT_QUERIES.updateLastOpened, [id]);
  },

  async toggleFavorite(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(PROJECT_QUERIES.toggleFavorite, [id]);
  },

  async togglePinned(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(PROJECT_QUERIES.togglePinned, [id]);
  },

  // ── Activity ──────────────────────────────────────────────────────
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

  async getEntityActivity(entityType: string, entityId: number) {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(ACTIVITY_QUERIES.getByEntity, [entityType, entityId]);
  },
};
