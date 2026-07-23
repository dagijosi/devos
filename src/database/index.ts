import {
  ALL_MIGRATIONS,
  SETTINGS_QUERIES,
  NOTIFICATION_QUERIES,
  PROJECT_QUERIES,
  ACTIVITY_QUERIES,
  NOTE_QUERIES,
  FOLDER_QUERIES,
  SNIPPET_QUERIES,
  BUG_QUERIES,
  ATTACHMENT_QUERIES,
  USER_QUERIES,
  WORKFLOW_QUERIES,
  WORKFLOW_LOG_QUERIES,
  AI_CONVERSATION_QUERIES,
  AI_MESSAGE_QUERIES,
  ANALYTICS_QUERIES,
  BACKUP_QUERIES,
  PROJECT_PATH_QUERIES,
  PROJECT_SCRIPT_QUERIES,
  PROJECT_LINK_QUERIES,
  PROJECT_TASK_QUERIES,
  PROJECT_ACTIVITY_QUERIES,
  KNOWLEDGE_QUERIES,
  RELATION_QUERIES,
  KNOWLEDGE_FOLDER_QUERIES,
  INSIGHTS_ACTIVITY_QUERIES,
  INSIGHTS_DAILY_QUERIES,
  INSIGHTS_PROJECT_STATS_QUERIES,
  INSIGHTS_GOAL_QUERIES,
  TOOL_QUERIES,
  RECENT_TOOL_QUERIES,
  TOOL_SETTINGS_QUERIES,
} from './schema';
import type { Project } from '../features/projects/types';
import type { KnowledgeItem, Note, Folder, CodeSnippet, Bug, Attachment } from '../features/knowledge/types';

type Row = Record<string, unknown>;
type DatabaseInstance = {
  execute: (sql: string, bind?: unknown[]) => Promise<unknown>;
  select: <T = Row>(sql: string, bind?: unknown[]) => Promise<T[]>;
};

let db: DatabaseInstance | null = null;
let useLocalFallback = false;

// ── localStorage helpers ───────────────────────────────────────────
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

function parseTags(val: unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return []; } }
  return [];
}

function toNote(row: Row): Note {
  return {
    id: Number(row.id),
    title: String(row.title ?? ''),
    content: String(row.content ?? ''),
    folder_id: row.folder_id ? Number(row.folder_id) : null,
    tags: parseTags(row.tags),
    favorite: Boolean(row.favorite),
    pinned: Boolean(row.pinned),
    project_id: row.project_id ? Number(row.project_id) : null,
    last_opened: row.last_opened ? String(row.last_opened) : null,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

function toFolder(row: Row): Folder {
  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    parent_id: row.parent_id ? Number(row.parent_id) : null,
    icon: String(row.icon ?? 'folder'),
    created_at: String(row.created_at ?? ''),
  };
}

function toSnippet(row: Row): CodeSnippet {
  return {
    id: Number(row.id),
    title: String(row.title ?? ''),
    code: String(row.code ?? ''),
    language: String(row.language ?? ''),
    description: String(row.description ?? ''),
    tags: parseTags(row.tags),
    favorite: Boolean(row.favorite),
    project_id: row.project_id ? Number(row.project_id) : null,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

function toWorkflow(row: Row): any {
  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    description: String(row.description ?? ''),
    steps: typeof row.steps === 'string' ? JSON.parse(row.steps as string) : row.steps ?? [],
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags as string) : row.tags ?? [],
    favorite: Boolean(row.favorite),
    category: String(row.category ?? 'custom'),
    last_run_at: row.last_run_at ? String(row.last_run_at) : null,
    last_run_status: row.last_run_status ? String(row.last_run_status) : null,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

function toWorkflowLog(row: Row): any {
  return {
    id: Number(row.id),
    workflow_id: Number(row.workflow_id),
    status: String(row.status ?? 'running'),
    step_logs: typeof row.step_logs === 'string' ? JSON.parse(row.step_logs as string) : row.step_logs ?? [],
    started_at: String(row.started_at ?? ''),
    completed_at: row.completed_at ? String(row.completed_at) : null,
  };
}

function toBug(row: Row): Bug {
  return {
    id: Number(row.id),
    title: String(row.title ?? ''),
    problem: String(row.problem ?? ''),
    solution: String(row.solution ?? ''),
    tags: parseTags(row.tags),
    project_id: row.project_id ? Number(row.project_id) : null,
    status: String(row.status ?? 'open'),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

function toAttachment(row: Row): Attachment {
  return {
    id: Number(row.id),
    note_id: Number(row.note_id),
    name: String(row.name ?? ''),
    file_path: String(row.file_path ?? ''),
    file_size: row.file_size ? Number(row.file_size) : null,
    mime_type: String(row.mime_type ?? ''),
    created_at: String(row.created_at ?? ''),
  };
}

function sortBy<T>(rows: T[], key: keyof T, dir: 'asc' | 'desc' = 'desc'): T[] {
  return [...rows].sort((a, b) => {
    const va = String(a[key] ?? '');
    const vb = String(b[key] ?? '');
    return dir === 'desc' ? vb.localeCompare(va) : va.localeCompare(vb);
  });
}

// ── LocalStorage Database ──────────────────────────────────────────
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
        name: bind?.[0] ?? '', description: bind?.[1] ?? '',
        tags: bind?.[2] ?? '[]', technology: bind?.[3] ?? '[]',
        repository_url: bind?.[4] ?? '', local_path: bind?.[5] ?? '',
        status: 'active', favorite: 0, pinned: 0,
        scripts: '{}', environment: '{}', last_opened: null,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      });
      lsSet('_db_projects', rows);
      return;
    }
    if (sql.startsWith('UPDATE PROJECTS SET NAME = ?')) {
      const rows = lsGet<Row>('_db_projects');
      const id = bind?.[11];
      const found = rows.find((r) => r.id === id);
      if (found) {
        found.name = bind?.[0]; found.description = bind?.[1]; found.status = bind?.[2];
        found.tags = bind?.[3]; found.technology = bind?.[4]; found.favorite = bind?.[5];
        found.pinned = bind?.[6]; found.repository_url = bind?.[7]; found.local_path = bind?.[8];
        found.scripts = bind?.[9]; found.environment = bind?.[10]; found.updated_at = new Date().toISOString();
      }
      lsSet('_db_projects', rows);
      return;
    }
    if (sql.includes('SET LAST_OPENED')) {
      const rows = lsGet<Row>('_db_projects');
      const found = rows.find((r) => r.id === bind?.[0]);
      if (found) { found.last_opened = new Date().toISOString(); found.updated_at = new Date().toISOString(); }
      // Also handle notes last_opened
      const noteRows = lsGet<Row>('_db_notes');
      const note = noteRows.find((r) => r.id === bind?.[0]);
      if (note) { note.last_opened = new Date().toISOString(); note.updated_at = new Date().toISOString(); }
      lsSet('_db_notes', noteRows);
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
      rows.push({
        id: nextId(rows as { id?: number }[]),
        title: bind?.[0], content: bind?.[1] ?? '',
        folder_id: bind?.[2] ?? null, tags: bind?.[3] ?? '[]',
        favorite: bind?.[4] ?? 0, pinned: bind?.[5] ?? 0,
        project_id: bind?.[6] ?? null, last_opened: null,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      });
      lsSet('_db_notes', rows);
      return;
    }
    if (sql.startsWith('UPDATE NOTES SET TITLE = ?')) {
      const rows = lsGet<Row>('_db_notes');
      const id = bind?.[7];
      const found = rows.find((r) => r.id === id);
      if (found) {
        found.title = bind?.[0]; found.content = bind?.[1]; found.folder_id = bind?.[2];
        found.tags = bind?.[3]; found.favorite = bind?.[4]; found.pinned = bind?.[5];
        found.project_id = bind?.[6]; found.updated_at = new Date().toISOString();
      }
      lsSet('_db_notes', rows);
      return;
    }
    if (sql.startsWith('DELETE FROM NOTES WHERE ID = ?')) {
      if (bind?.length) lsSet('_db_notes', lsGet<Row>('_db_notes').filter((r) => r.id !== bind[0]));
      else lsSet('_db_notes', []);
      return;
    }
    // Note favorite/pinned toggle (same CASE patterns as projects)
    if (sql.includes('NOTES SET FAVORITE = CASE')) {
      const rows = lsGet<Row>('_db_notes');
      const found = rows.find((r) => r.id === bind?.[0]);
      if (found) { found.favorite = found.favorite === 1 ? 0 : 1; found.updated_at = new Date().toISOString(); }
      lsSet('_db_notes', rows);
      return;
    }
    if (sql.includes('NOTES SET PINNED = CASE')) {
      const rows = lsGet<Row>('_db_notes');
      const found = rows.find((r) => r.id === bind?.[0]);
      if (found) { found.pinned = found.pinned === 1 ? 0 : 1; found.updated_at = new Date().toISOString(); }
      lsSet('_db_notes', rows);
      return;
    }
    // Folders
    if (sql.startsWith('INSERT INTO FOLDERS')) {
      const rows = lsGet<Row>('_db_folders');
      rows.push({ id: nextId(rows as { id?: number }[]), name: bind?.[0], parent_id: bind?.[1] ?? null, icon: bind?.[2] ?? 'folder', created_at: new Date().toISOString() });
      lsSet('_db_folders', rows);
      return;
    }
    if (sql.startsWith('UPDATE FOLDERS SET NAME = ?')) {
      const rows = lsGet<Row>('_db_folders');
      const found = rows.find((r) => r.id === bind?.[2]);
      if (found) { found.name = bind?.[0]; found.icon = bind?.[1]; }
      lsSet('_db_folders', rows);
      return;
    }
    if (sql.startsWith('DELETE FROM FOLDERS')) {
      if (bind?.length) lsSet('_db_folders', lsGet<Row>('_db_folders').filter((r) => r.id !== bind[0]));
      else lsSet('_db_folders', []);
      return;
    }
    // Snippets
    if (sql.startsWith('INSERT INTO CODE_SNIPPETS')) {
      const rows = lsGet<Row>('_db_snippets');
      rows.push({
        id: nextId(rows as { id?: number }[]),
        title: bind?.[0], code: bind?.[1], language: bind?.[2],
        description: bind?.[3] ?? '', tags: bind?.[4] ?? '[]',
        favorite: bind?.[5] ?? 0, project_id: bind?.[6] ?? null,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      });
      lsSet('_db_snippets', rows);
      return;
    }
    if (sql.startsWith('UPDATE CODE_SNIPPETS SET TITLE = ?')) {
      const rows = lsGet<Row>('_db_snippets');
      const id = bind?.[7];
      const found = rows.find((r) => r.id === id);
      if (found) {
        found.title = bind?.[0]; found.code = bind?.[1]; found.language = bind?.[2];
        found.description = bind?.[3]; found.tags = bind?.[4]; found.favorite = bind?.[5];
        found.project_id = bind?.[6]; found.updated_at = new Date().toISOString();
      }
      lsSet('_db_snippets', rows);
      return;
    }
    if (sql.startsWith('DELETE FROM CODE_SNIPPETS')) {
      if (bind?.length) lsSet('_db_snippets', lsGet<Row>('_db_snippets').filter((r) => r.id !== bind[0]));
      else lsSet('_db_snippets', []);
      return;
    }
    if (sql.includes('CODE_SNIPPETS SET FAVORITE = CASE')) {
      const rows = lsGet<Row>('_db_snippets');
      const found = rows.find((r) => r.id === bind?.[0]);
      if (found) { found.favorite = found.favorite === 1 ? 0 : 1; found.updated_at = new Date().toISOString(); }
      lsSet('_db_snippets', rows);
      return;
    }
    // Bugs
    if (sql.startsWith('INSERT INTO BUGS')) {
      const rows = lsGet<Row>('_db_bugs');
      rows.push({
        id: nextId(rows as { id?: number }[]),
        title: bind?.[0], problem: bind?.[1], solution: bind?.[2] ?? '',
        tags: bind?.[3] ?? '[]', project_id: bind?.[4] ?? null, status: bind?.[5] ?? 'open',
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      });
      lsSet('_db_bugs', rows);
      return;
    }
    if (sql.startsWith('UPDATE BUGS SET TITLE = ?')) {
      const rows = lsGet<Row>('_db_bugs');
      const id = bind?.[6];
      const found = rows.find((r) => r.id === id);
      if (found) {
        found.title = bind?.[0]; found.problem = bind?.[1]; found.solution = bind?.[2];
        found.tags = bind?.[3]; found.project_id = bind?.[4]; found.status = bind?.[5];
        found.updated_at = new Date().toISOString();
      }
      lsSet('_db_bugs', rows);
      return;
    }
    if (sql.startsWith('DELETE FROM BUGS')) {
      if (bind?.length) lsSet('_db_bugs', lsGet<Row>('_db_bugs').filter((r) => r.id !== bind[0]));
      else lsSet('_db_bugs', []);
      return;
    }
    // Attachments
    if (sql.startsWith('INSERT INTO ATTACHMENTS')) {
      const rows = lsGet<Row>('_db_attachments');
      rows.push({ id: nextId(rows as { id?: number }[]), note_id: bind?.[0], name: bind?.[1], file_path: bind?.[2], file_size: bind?.[3] ?? null, mime_type: bind?.[4] ?? '', created_at: new Date().toISOString() });
      lsSet('_db_attachments', rows);
      return;
    }
    if (sql.startsWith('DELETE FROM ATTACHMENTS')) {
      if (bind?.length) lsSet('_db_attachments', lsGet<Row>('_db_attachments').filter((r) => r.id !== bind[0]));
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
    // Workflows
    if (sql.startsWith('INSERT INTO WORKFLOWS')) {
      const rows = lsGet<Row>('_db_workflows');
      rows.push({ id: nextId(rows as { id?: number }[]), name: bind?.[0], description: bind?.[1] ?? '', steps: bind?.[2] ?? '[]', tags: bind?.[3] ?? '[]', favorite: bind?.[4] ?? 0, category: bind?.[5] ?? 'custom', last_run_at: null, last_run_status: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      lsSet('_db_workflows', rows);
      return;
    }
    if (sql.startsWith('UPDATE WORKFLOWS SET NAME = ?')) {
      const rows = lsGet<Row>('_db_workflows');
      const id = bind?.[6];
      const found = rows.find((r) => r.id === id);
      if (found) { found.name = bind?.[0]; found.description = bind?.[1]; found.steps = bind?.[2]; found.tags = bind?.[3]; found.favorite = bind?.[4]; found.category = bind?.[5]; found.updated_at = new Date().toISOString(); }
      lsSet('_db_workflows', rows);
      return;
    }
    if (sql.includes('WORKFLOWS SET FAVORITE = CASE')) {
      const rows = lsGet<Row>('_db_workflows');
      const found = rows.find((r) => r.id === bind?.[0]);
      if (found) { found.favorite = found.favorite === 1 ? 0 : 1; found.updated_at = new Date().toISOString(); }
      lsSet('_db_workflows', rows);
      return;
    }
    if (sql.startsWith('UPDATE WORKFLOWS SET LAST_RUN_AT')) {
      const rows = lsGet<Row>('_db_workflows');
      const found = rows.find((r) => r.id === bind?.[1]);
      if (found) { found.last_run_at = new Date().toISOString(); found.last_run_status = bind?.[0]; found.updated_at = new Date().toISOString(); }
      lsSet('_db_workflows', rows);
      return;
    }
    if (sql.startsWith('DELETE FROM WORKFLOWS')) {
      if (bind?.length) lsSet('_db_workflows', lsGet<Row>('_db_workflows').filter((r) => r.id !== bind[0]));
      else lsSet('_db_workflows', []);
      return;
    }
    // Workflow logs
    if (sql.startsWith('INSERT INTO WORKFLOW_LOGS')) {
      const rows = lsGet<Row>('_db_workflow_logs');
      rows.push({ id: nextId(rows as { id?: number }[]), workflow_id: bind?.[0], status: bind?.[1] ?? 'running', step_logs: bind?.[2] ?? '[]', started_at: new Date().toISOString(), completed_at: null });
      lsSet('_db_workflow_logs', rows);
      return;
    }
    if (sql.startsWith('UPDATE WORKFLOW_LOGS SET STATUS = ?')) {
      const rows = lsGet<Row>('_db_workflow_logs');
      const found = rows.find((r) => r.id === bind?.[3]);
      if (found) { found.status = bind?.[0]; found.step_logs = bind?.[1]; found.completed_at = new Date().toISOString(); }
      lsSet('_db_workflow_logs', rows);
      return;
    }
    if (sql.startsWith('DELETE FROM WORKFLOW_LOGS')) {
      if (bind?.length) lsSet('_db_workflow_logs', lsGet<Row>('_db_workflow_logs').filter((r) => r.id !== bind[0]));
      else lsSet('_db_workflow_logs', []);
      return;
    }
    if (sql.includes('DELETE FROM WORKFLOW_LOGS WHERE WORKFLOW_ID = ?')) {
      const wid = bind?.[0];
      lsSet('_db_workflow_logs', lsGet<Row>('_db_workflow_logs').filter((r) => r.workflow_id !== wid));
      return;
    }
    // AI conversations
    if (sql.startsWith('INSERT INTO AI_CONVERSATIONS')) {
      const rows = lsGet<Row>('_db_ai_conversations');
      rows.push({ id: nextId(rows as { id?: number }[]), title: bind?.[0] ?? 'New Conversation', provider: bind?.[1] ?? '', model: bind?.[2] ?? '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      lsSet('_db_ai_conversations', rows);
      return;
    }
    if (sql.startsWith('UPDATE AI_CONVERSATIONS SET TITLE = ?')) {
      const rows = lsGet<Row>('_db_ai_conversations');
      const found = rows.find((r) => r.id === bind?.[3]);
      if (found) { found.title = bind?.[0]; found.provider = bind?.[1]; found.model = bind?.[2]; found.updated_at = new Date().toISOString(); }
      lsSet('_db_ai_conversations', rows);
      return;
    }
    if (sql.startsWith('DELETE FROM AI_CONVERSATIONS')) {
      const id = bind?.[0];
      lsSet('_db_ai_conversations', lsGet<Row>('_db_ai_conversations').filter((r) => r.id !== id));
      if (id) lsSet('_db_ai_messages', lsGet<Row>('_db_ai_messages').filter((r) => r.conversation_id !== id));
      return;
    }
    // AI messages
    if (sql.startsWith('INSERT INTO AI_MESSAGES')) {
      const rows = lsGet<Row>('_db_ai_messages');
      rows.push({ id: nextId(rows as { id?: number }[]), conversation_id: bind?.[0], role: bind?.[1], content: bind?.[2], tool_calls: bind?.[3] ?? '[]', created_at: new Date().toISOString() });
      lsSet('_db_ai_messages', rows);
      return;
    }
    if (sql.startsWith('DELETE FROM AI_MESSAGES')) {
      const convId = bind?.[0];
      if (convId) lsSet('_db_ai_messages', lsGet<Row>('_db_ai_messages').filter((r) => r.conversation_id !== convId));
      else lsSet('_db_ai_messages', []);
      return;
    }
    // Analytics sessions
    if (sql.startsWith('INSERT INTO ANALYTICS_SESSIONS')) {
      const rows = lsGet<Row>('_db_analytics_sessions');
      rows.push({ id: nextId(rows as { id?: number }[]), date: bind?.[0], duration_minutes: bind?.[1] ?? 0, type: bind?.[2] ?? 'focus', label: bind?.[3] ?? '', created_at: new Date().toISOString() });
      lsSet('_db_analytics_sessions', rows);
      return;
    }
    if (sql.startsWith('DELETE FROM ANALYTICS_SESSIONS')) {
      lsSet('_db_analytics_sessions', []);
      return;
    }
    // Backups
    if (sql.startsWith('INSERT INTO BACKUPS')) {
      const rows = lsGet<Row>('_db_backups');
      rows.push({ id: nextId(rows as { id?: number }[]), filename: bind?.[0], size_bytes: bind?.[1] ?? 0, type: bind?.[2] ?? 'manual', encrypted: bind?.[3] ?? 0, notes: bind?.[4] ?? '', created_at: new Date().toISOString() });
      lsSet('_db_backups', rows);
      return;
    }
    if (sql.startsWith('DELETE FROM BACKUPS WHERE ID = ?')) {
      const id = bind?.[0];
      lsSet('_db_backups', lsGet<Row>('_db_backups').filter((r) => r.id !== id));
      return;
    }
    if (sql.startsWith('DELETE FROM BACKUPS')) {
      lsSet('_db_backups', []);
      return;
    }
    // Generic CREATE TABLE IF NOT EXISTS / ALTER / DDL
    if (sql.includes('CREATE TABLE') || sql.startsWith('ALTER') || sql.startsWith('CREATE TRIGGER') || sql.startsWith('CREATE VIRTUAL')) return;
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
    if (sql.startsWith('SELECT * FROM NOTES WHERE FAVORITE = 1')) {
      return lsGet<Row>('_db_notes').filter((r) => r.favorite === 1).map(toNote) as T[];
    }
    if (sql.startsWith('SELECT * FROM NOTES WHERE PINNED = 1')) {
      return lsGet<Row>('_db_notes').filter((r) => r.pinned === 1).map(toNote) as T[];
    }
    if (sql.startsWith('SELECT * FROM NOTES WHERE ID = ?')) {
      const found = lsGet<Row>('_db_notes').find((r) => r.id === bind?.[0]);
      return (found ? [toNote(found)] : []) as T[];
    }
    if (sql.startsWith('SELECT * FROM NOTES WHERE FOLDER_ID = ?')) {
      return lsGet<Row>('_db_notes').filter((r) => r.folder_id === bind?.[0]).map(toNote) as T[];
    }
    if (sql.startsWith('SELECT * FROM NOTES WHERE TITLE LIKE ?')) {
      const q = String(bind?.[0] ?? '').replace(/%/g, '').toLowerCase();
      return lsGet<Row>('_db_notes').filter((r) => String(r.title).toLowerCase().includes(q) || String(r.content).toLowerCase().includes(q)).map(toNote) as T[];
    }
    if (sql.startsWith('SELECT * FROM NOTES ORDER BY LAST_OPENED DESC')) {
      const rows = lsGet<Row>('_db_notes').sort((a, b) => {
        const la = a.last_opened ? new Date(String(a.last_opened)).getTime() : 0;
        const lb = b.last_opened ? new Date(String(b.last_opened)).getTime() : 0;
        return lb - la || String(b.updated_at).localeCompare(String(a.updated_at));
      });
      return (bind?.length ? rows.slice(0, bind[0] as number) : rows).map(toNote) as T[];
    }
    if (sql.startsWith('SELECT * FROM NOTES ORDER BY UPDATED_AT DESC')) {
      const rows = sortBy(lsGet<Row>('_db_notes'), 'updated_at');
      return (bind?.length ? rows.slice(0, bind[0] as number) : rows).map(toNote) as T[];
    }
    // Folders
    if (sql.startsWith('SELECT * FROM FOLDERS WHERE ID = ?')) {
      const found = lsGet<Row>('_db_folders').find((r) => r.id === bind?.[0]);
      return (found ? [toFolder(found)] : []) as T[];
    }
    if (sql.startsWith('SELECT * FROM FOLDERS WHERE PARENT_ID = ?')) {
      return lsGet<Row>('_db_folders').filter((r) => r.parent_id === bind?.[0]).map(toFolder) as T[];
    }
    if (sql.startsWith('SELECT * FROM FOLDERS WHERE PARENT_ID IS NULL ORDER BY NAME')) {
      return lsGet<Row>('_db_folders').filter((r) => r.parent_id === null || r.parent_id === undefined).map(toFolder) as T[];
    }
    if (sql.startsWith('SELECT * FROM FOLDERS ORDER BY NAME')) {
      return sortBy(lsGet<Row>('_db_folders'), 'name', 'asc').map(toFolder) as T[];
    }
    // Snippets
    if (sql.startsWith('SELECT * FROM CODE_SNIPPETS WHERE FAVORITE = 1')) {
      return lsGet<Row>('_db_snippets').filter((r) => r.favorite === 1).map(toSnippet) as T[];
    }
    if (sql.startsWith('SELECT * FROM CODE_SNIPPETS WHERE ID = ?')) {
      const found = lsGet<Row>('_db_snippets').find((r) => r.id === bind?.[0]);
      return (found ? [toSnippet(found)] : []) as T[];
    }
    if (sql.startsWith('SELECT * FROM CODE_SNIPPETS WHERE LANGUAGE = ?')) {
      return lsGet<Row>('_db_snippets').filter((r) => r.language === bind?.[0]).map(toSnippet) as T[];
    }
    if (sql.startsWith('SELECT * FROM CODE_SNIPPETS WHERE TITLE LIKE ?')) {
      const q = String(bind?.[0] ?? '').replace(/%/g, '').toLowerCase();
      return lsGet<Row>('_db_snippets').filter((r) => String(r.title).toLowerCase().includes(q) || String(r.description).toLowerCase().includes(q) || String(r.code).toLowerCase().includes(q)).map(toSnippet) as T[];
    }
    if (sql.startsWith('SELECT * FROM CODE_SNIPPETS ORDER BY UPDATED_AT DESC')) {
      return sortBy(lsGet<Row>('_db_snippets'), 'updated_at').map(toSnippet) as T[];
    }
    // Bugs
    if (sql.startsWith('SELECT * FROM BUGS WHERE ID = ?')) {
      const found = lsGet<Row>('_db_bugs').find((r) => r.id === bind?.[0]);
      return (found ? [toBug(found)] : []) as T[];
    }
    if (sql.startsWith('SELECT * FROM BUGS WHERE PROJECT_ID = ?')) {
      return lsGet<Row>('_db_bugs').filter((r) => r.project_id === bind?.[0]).map(toBug) as T[];
    }
    if (sql.startsWith('SELECT * FROM BUGS WHERE TITLE LIKE ?')) {
      const q = String(bind?.[0] ?? '').replace(/%/g, '').toLowerCase();
      return lsGet<Row>('_db_bugs').filter((r) => String(r.title).toLowerCase().includes(q) || String(r.problem).toLowerCase().includes(q) || String(r.solution).toLowerCase().includes(q)).map(toBug) as T[];
    }
    if (sql.startsWith('SELECT * FROM BUGS ORDER BY UPDATED_AT DESC')) {
      return sortBy(lsGet<Row>('_db_bugs'), 'updated_at').map(toBug) as T[];
    }
    // Attachments
    if (sql.startsWith('SELECT * FROM ATTACHMENTS WHERE NOTE_ID = ?')) {
      return lsGet<Row>('_db_attachments').filter((r) => r.note_id === bind?.[0]).map(toAttachment) as T[];
    }
    // Activity
    if (sql.startsWith('SELECT * FROM RECENT_ACTIVITY WHERE ENTITY_TYPE = ? AND ENTITY_ID = ?')) {
      return sortBy(lsGet<Row>('_db_activity').filter((r) => r.entity_type === bind?.[0] && r.entity_id === bind?.[1]), 'created_at') as T[];
    }
    if (sql.startsWith('SELECT * FROM RECENT_ACTIVITY ORDER BY CREATED_AT DESC')) {
      return sortBy(lsGet<Row>('_db_activity'), 'created_at') as T[];
    }
    // Tags
    if (sql.startsWith('SELECT * FROM TAGS')) {
      return lsGet<Row>('_db_tags') as T[];
    }
    // Workflows
    if (sql.startsWith('SELECT * FROM WORKFLOWS WHERE ID = ?')) {
      const found = lsGet<Row>('_db_workflows').find((r) => r.id === bind?.[0]);
      return (found ? [found] : []) as T[];
    }
    if (sql.startsWith('SELECT * FROM WORKFLOWS WHERE NAME LIKE ?')) {
      const q = String(bind?.[0] ?? '').replace(/%/g, '').toLowerCase();
      return lsGet<Row>('_db_workflows').filter((r) => String(r.name).toLowerCase().includes(q) || String(r.description).toLowerCase().includes(q)) as T[];
    }
    if (sql.startsWith('SELECT * FROM WORKFLOWS ORDER BY UPDATED_AT DESC')) {
      return sortBy(lsGet<Row>('_db_workflows'), 'updated_at') as T[];
    }
    // Workflow logs
    if (sql.startsWith('SELECT * FROM WORKFLOW_LOGS WHERE ID = ?')) {
      const found = lsGet<Row>('_db_workflow_logs').find((r) => r.id === bind?.[0]);
      return (found ? [found] : []) as T[];
    }
    if (sql.startsWith('SELECT * FROM WORKFLOW_LOGS WHERE WORKFLOW_ID = ?')) {
      return sortBy(lsGet<Row>('_db_workflow_logs').filter((r) => r.workflow_id === bind?.[0]), 'started_at') as T[];
    }
    // AI conversations
    if (sql.startsWith('SELECT * FROM AI_CONVERSATIONS WHERE ID = ?')) {
      const found = lsGet<Row>('_db_ai_conversations').find((r) => r.id === bind?.[0]);
      return (found ? [found] : []) as T[];
    }
    if (sql.startsWith('SELECT * FROM AI_CONVERSATIONS ORDER BY UPDATED_AT DESC')) {
      return sortBy(lsGet<Row>('_db_ai_conversations'), 'updated_at') as T[];
    }
    // AI messages
    if (sql.startsWith('SELECT * FROM AI_MESSAGES WHERE CONVERSATION_ID = ?')) {
      return sortBy(lsGet<Row>('_db_ai_messages').filter((r) => r.conversation_id === bind?.[0]), 'created_at', 'asc') as T[];
    }
    // Analytics sessions
    if (sql.startsWith('SELECT * FROM ANALYTICS_SESSIONS WHERE DATE >= ?')) {
      const from = bind?.[0]; const to = bind?.[1];
      return sortBy(lsGet<Row>('_db_analytics_sessions').filter((r) => String(r.date) >= String(from) && String(r.date) <= String(to)), 'date', 'asc') as T[];
    }
    if (sql.startsWith('SELECT * FROM ANALYTICS_SESSIONS WHERE DATE = ?')) {
      const d = bind?.[0];
      return sortBy(lsGet<Row>('_db_analytics_sessions').filter((r) => String(r.date) === String(d)), 'created_at', 'asc') as T[];
    }
    if (sql.startsWith('SELECT * FROM ANALYTICS_SESSIONS ORDER BY CREATED_AT DESC')) {
      return sortBy(lsGet<Row>('_db_analytics_sessions'), 'created_at') as T[];
    }
    // Backups
    if (sql.startsWith('SELECT * FROM BACKUPS WHERE ID = ?')) {
      const found = lsGet<Row>('_db_backups').find((r) => r.id === bind?.[0]);
      return (found ? [found] : []) as T[];
    }
    if (sql.startsWith('SELECT * FROM BACKUPS ORDER BY CREATED_AT DESC')) {
      return sortBy(lsGet<Row>('_db_backups'), 'created_at') as T[];
    }
    return [];
  }
}

// ── Database resolution ────────────────────────────────────────────
async function getDatabase(): Promise<DatabaseInstance | null> {
  if (db) return db;
  try {
    // Try Tauri SQLite first (desktop app)
    const Database = (await import('@tauri-apps/plugin-sql')).default;
    db = await Database.load('sqlite:developer_os.db');
    return db;
  } catch {
    try {
      // Fall back to sql.js for web dev (browser)
      const initSqlJs = (await import('sql.js')).default;
      // Use the memory-only version to avoid WASM loading issues
      const SQL = await initSqlJs({ locateFile: () => 'https://sql.js.org/dist/sql-wasm.wasm' });
      
      // Try to load from localStorage persistence
      const savedDb = localStorage.getItem('devos_sqlite_db');
      let sqlDb: any;
      if (savedDb) {
        const uint8Array = new Uint8Array(JSON.parse(savedDb));
        sqlDb = new SQL.Database(uint8Array);
      } else {
        sqlDb = new SQL.Database();
      }
      
      // Create a wrapper that matches our DatabaseInstance interface
      db = {
        async execute(sql: string, bind?: unknown[]): Promise<void> {
          sqlDb.run(sql, bind as any);
          // Persist after each write
          const data = sqlDb.export();
          const arr = Array.from(data);
          localStorage.setItem('devos_sqlite_db', JSON.stringify(arr));
        },
        async select<T = Row>(sql: string, bind?: unknown[]): Promise<T[]> {
          const stmt = sqlDb.prepare(sql);
          stmt.bind(bind as any);
          const results: T[] = [];
          while (stmt.step()) {
            results.push(stmt.getAsObject() as T);
          }
          stmt.free();
          return results;
        },
      };
      return db;
    } catch {
      if (!useLocalFallback) {
        useLocalFallback = true;
        console.log('[DB] Using localStorage fallback (SQLite unavailable)');
      }
      db = new LocalDatabase();
      return db;
    }
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
    icon: String(row.icon ?? 'folder'),
    color: String(row.color ?? '#6366f1'),
    category: String(row.category ?? ''),
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

function toKnowledgeItem(row: Row): KnowledgeItem {
  return {
    id: Number(row.id),
    title: String(row.title ?? ''),
    type: (row.type as KnowledgeItem['type']) ?? 'note',
    content: String(row.content ?? ''),
    description: String(row.description ?? ''),
    language: String(row.language ?? ''),
    url: String(row.url ?? ''),
    problem: String(row.problem ?? ''),
    cause: String(row.cause ?? ''),
    solution: String(row.solution ?? ''),
    severity: String(row.severity ?? ''),
    category: String(row.category ?? ''),
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags as string) : row.tags ?? [],
    favorite: Boolean(row.favorite),
    pinned: Boolean(row.pinned),
    status: (row.status as KnowledgeItem['status']) ?? 'active',
    project_id: row.project_id ? Number(row.project_id) : null,
    folder_id: row.folder_id ? Number(row.folder_id) : null,
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

  // ── Projects ────────────────────────────────────────────────────
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

  async toggleProjectFavorite(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(PROJECT_QUERIES.toggleFavorite, [id]);
  },

  async toggleProjectPinned(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(PROJECT_QUERIES.togglePinned, [id]);
  },

  // ── Project sub-entities ─────────────────────────────────────────
  async getProjectPaths(projectId: number): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select<any>(PROJECT_PATH_QUERIES.getByProject, [projectId]);
  },

  async addProjectPath(projectId: number, path: string, type: string = 'local'): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(PROJECT_PATH_QUERIES.insert, [projectId, path, type]);
  },

  async deleteProjectPath(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(PROJECT_PATH_QUERIES.delete, [id]);
  },

  async getProjectScripts(projectId: number): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select<any>(PROJECT_SCRIPT_QUERIES.getByProject, [projectId]);
  },

  async addProjectScript(projectId: number, name: string, command: string): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(PROJECT_SCRIPT_QUERIES.insert, [projectId, name, command]);
  },

  async deleteProjectScript(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(PROJECT_SCRIPT_QUERIES.delete, [id]);
  },

  async getProjectLinks(projectId: number): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select<any>(PROJECT_LINK_QUERIES.getByProject, [projectId]);
  },

  async addProjectLink(projectId: number, type: string, url: string): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(PROJECT_LINK_QUERIES.insert, [projectId, type, url]);
  },

  async deleteProjectLink(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(PROJECT_LINK_QUERIES.delete, [id]);
  },

  async getProjectTasks(projectId: number): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select<any>(PROJECT_TASK_QUERIES.getByProject, [projectId]);
  },

  async addProjectTask(projectId: number, title: string, priority: string = 'medium', due_date?: string): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(PROJECT_TASK_QUERIES.insert, [projectId, title, '', priority, 'todo', due_date || null]);
  },

  async updateProjectTask(id: number, data: any): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(PROJECT_TASK_QUERIES.update, [data.title, data.description || '', data.priority, data.status, data.due_date || null, id]);
  },

  async deleteProjectTask(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(PROJECT_TASK_QUERIES.delete, [id]);
  },

  async getProjectActivity(projectId: number, limit: number = 10): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select<any>(PROJECT_ACTIVITY_QUERIES.getByProject, [projectId, limit]);
  },

  async addProjectActivity(projectId: number, title: string, type: string = 'update'): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(PROJECT_ACTIVITY_QUERIES.insert, [projectId, title, type]);
  },

  // ── Notes ────────────────────────────────────────────────────────
  async getNotes(): Promise<Note[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(NOTE_QUERIES.getAll);
    return rows.map(toNote);
  },

  async getNote(id: number): Promise<Note | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    const rows = await inst.select<Row>(NOTE_QUERIES.getById, [id]);
    return rows.length ? toNote(rows[0]) : null;
  },

  async getNotesByFolder(folderId: number): Promise<Note[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(NOTE_QUERIES.getByFolder, [folderId]);
    return rows.map(toNote);
  },

  async createNote(data: { title: string; content?: string; folder_id?: number | null; tags?: string; favorite?: number; pinned?: number; project_id?: number | null }): Promise<Note | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    await inst.execute(NOTE_QUERIES.insert, [
      data.title, data.content ?? '',
      data.folder_id ?? null, data.tags ?? '[]',
      data.favorite ?? 0, data.pinned ?? 0,
      data.project_id ?? null,
    ]);
    const rows = await inst.select<Row>(NOTE_QUERIES.getAll);
    const note = rows.length ? toNote(rows[0]) : null;
    if (note) {
      try { await inst.execute('INSERT INTO notes_fts(rowid, title, content, tags) VALUES (?, ?, ?, ?)', [note.id, note.title, note.content, JSON.stringify(note.tags)]); } catch { /* fts5 unavailable */ }
    }
    return note;
  },

  async updateNote(id: number, data: Partial<Note>): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    const existing = await this.getNote(id);
    if (!existing) return;
    const merged = { ...existing, ...data };
    await inst.execute(NOTE_QUERIES.update, [
      merged.title, merged.content,
      merged.folder_id, JSON.stringify(merged.tags),
      merged.favorite ? 1 : 0, merged.pinned ? 1 : 0,
      merged.project_id, id,
    ]);
    try {
      await inst.execute('INSERT INTO notes_fts(notes_fts, rowid, title, content, tags) VALUES(?, ?, ?, ?, ?)', ['delete', id, '', '', '']);
      await inst.execute('INSERT INTO notes_fts(rowid, title, content, tags) VALUES (?, ?, ?, ?)', [id, merged.title, merged.content, JSON.stringify(merged.tags)]);
    } catch { /* fts5 unavailable */ }
  },

  async deleteNote(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(NOTE_QUERIES.delete, [id]);
    try { await inst.execute('INSERT INTO notes_fts(notes_fts, rowid, title, content, tags) VALUES(?, ?, ?, ?, ?)', ['delete', id, '', '', '']); } catch { /* fts5 unavailable */ }
  },

  async getFavoriteNotes(): Promise<Note[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(NOTE_QUERIES.getFavorites);
    return rows.map(toNote);
  },

  async getPinnedNotes(): Promise<Note[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(NOTE_QUERIES.getPinned);
    return rows.map(toNote);
  },

  async getRecentNotes(limit = 5): Promise<Note[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(NOTE_QUERIES.getRecent, [limit]);
    return rows.map(toNote);
  },

  async searchNotes(query: string): Promise<Note[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    try {
      const rows = await inst.select<Row>(NOTE_QUERIES.searchFts, [query]);
      if (rows.length) return rows.map(toNote);
    } catch { /* FTS not available, fall through */ }
    const rows = await inst.select<Row>(NOTE_QUERIES.search, [`%${query}%`, `%${query}%`]);
    return rows.map(toNote);
  },

  async toggleNoteFavorite(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(NOTE_QUERIES.toggleFavorite, [id]);
  },

  async toggleNotePinned(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(NOTE_QUERIES.togglePinned, [id]);
  },

  // ── Folders ──────────────────────────────────────────────────────
  async getFolders(): Promise<Folder[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(FOLDER_QUERIES.getAll);
    return rows.map(toFolder);
  },

  async getFolder(id: number): Promise<Folder | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    const rows = await inst.select<Row>(FOLDER_QUERIES.getById, [id]);
    return rows.length ? toFolder(rows[0]) : null;
  },

  async getRootFolders(): Promise<Folder[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(FOLDER_QUERIES.getRoot);
    return rows.map(toFolder);
  },

  async getChildFolders(parentId: number): Promise<Folder[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(FOLDER_QUERIES.getChildren, [parentId]);
    return rows.map(toFolder);
  },

  async createFolder(data: { name: string; parent_id?: number | null; icon?: string }): Promise<Folder | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    await inst.execute(FOLDER_QUERIES.insert, [data.name, data.parent_id ?? null, data.icon ?? 'folder']);
    const rows = await inst.select<Row>(FOLDER_QUERIES.getAll);
    return rows.length ? toFolder(rows[rows.length - 1]) : null;
  },

  async updateFolder(id: number, data: { name?: string; icon?: string }): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    const existing = await this.getFolder(id);
    if (!existing) return;
    await inst.execute(FOLDER_QUERIES.update, [data.name ?? existing.name, data.icon ?? existing.icon, id]);
  },

  async deleteFolder(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(FOLDER_QUERIES.delete, [id]);
  },

  // ── Code Snippets ────────────────────────────────────────────────
  async getSnippets(): Promise<CodeSnippet[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(SNIPPET_QUERIES.getAll);
    return rows.map(toSnippet);
  },

  async getSnippet(id: number): Promise<CodeSnippet | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    const rows = await inst.select<Row>(SNIPPET_QUERIES.getById, [id]);
    return rows.length ? toSnippet(rows[0]) : null;
  },

  async getSnippetsByLanguage(language: string): Promise<CodeSnippet[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(SNIPPET_QUERIES.getByLanguage, [language]);
    return rows.map(toSnippet);
  },

  async createSnippet(data: { title: string; code: string; language: string; description?: string; tags?: string; favorite?: number; project_id?: number | null }): Promise<CodeSnippet | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    await inst.execute(SNIPPET_QUERIES.insert, [
      data.title, data.code, data.language,
      data.description ?? '', data.tags ?? '[]',
      data.favorite ?? 0, data.project_id ?? null,
    ]);
    const rows = await inst.select<Row>(SNIPPET_QUERIES.getAll);
    return rows.length ? toSnippet(rows[0]) : null;
  },

  async updateSnippet(id: number, data: Partial<CodeSnippet>): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    const existing = await this.getSnippet(id);
    if (!existing) return;
    const merged = { ...existing, ...data };
    await inst.execute(SNIPPET_QUERIES.update, [
      merged.title, merged.code, merged.language,
      merged.description, JSON.stringify(merged.tags),
      merged.favorite ? 1 : 0, merged.project_id, id,
    ]);
  },

  async deleteSnippet(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(SNIPPET_QUERIES.delete, [id]);
  },

  async getFavoriteSnippets(): Promise<CodeSnippet[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(SNIPPET_QUERIES.getFavorites);
    return rows.map(toSnippet);
  },

  async toggleSnippetFavorite(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(SNIPPET_QUERIES.toggleFavorite, [id]);
  },

  async searchSnippets(query: string): Promise<CodeSnippet[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(SNIPPET_QUERIES.search, [`%${query}%`, `%${query}%`, `%${query}%`]);
    return rows.map(toSnippet);
  },

  // ── Bugs ─────────────────────────────────────────────────────────
  async getBugs(): Promise<Bug[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(BUG_QUERIES.getAll);
    return rows.map(toBug);
  },

  async getBug(id: number): Promise<Bug | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    const rows = await inst.select<Row>(BUG_QUERIES.getById, [id]);
    return rows.length ? toBug(rows[0]) : null;
  },

  async getBugsByProject(projectId: number): Promise<Bug[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(BUG_QUERIES.getByProject, [projectId]);
    return rows.map(toBug);
  },

  async createBug(data: { title: string; problem: string; solution?: string; tags?: string; project_id?: number | null; status?: string }): Promise<Bug | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    await inst.execute(BUG_QUERIES.insert, [
      data.title, data.problem, data.solution ?? '',
      data.tags ?? '[]', data.project_id ?? null, data.status ?? 'open',
    ]);
    const rows = await inst.select<Row>(BUG_QUERIES.getAll);
    return rows.length ? toBug(rows[0]) : null;
  },

  async updateBug(id: number, data: Partial<Bug>): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    const existing = await this.getBug(id);
    if (!existing) return;
    const merged = { ...existing, ...data };
    await inst.execute(BUG_QUERIES.update, [
      merged.title, merged.problem, merged.solution,
      JSON.stringify(merged.tags), merged.project_id, merged.status, id,
    ]);
  },

  async deleteBug(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(BUG_QUERIES.delete, [id]);
  },

  async searchBugs(query: string): Promise<Bug[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(BUG_QUERIES.search, [`%${query}%`, `%${query}%`, `%${query}%`]);
    return rows.map(toBug);
  },

  // ── Attachments ──────────────────────────────────────────────────
  async getAttachments(noteId: number): Promise<Attachment[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(ATTACHMENT_QUERIES.getByNote, [noteId]);
    return rows.map(toAttachment);
  },

  async createAttachment(data: { note_id: number; name: string; file_path: string; file_size?: number; mime_type?: string }): Promise<Attachment | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    await inst.execute(ATTACHMENT_QUERIES.insert, [
      data.note_id, data.name, data.file_path,
      data.file_size ?? null, data.mime_type ?? '',
    ]);
    return { id: 0, ...data, file_size: data.file_size ?? null, mime_type: data.mime_type ?? '', created_at: new Date().toISOString() };
  },

  async deleteAttachment(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(ATTACHMENT_QUERIES.delete, [id]);
  },

  // ── Tags ─────────────────────────────────────────────────────────
  async getTags(): Promise<{ id: number; name: string; color: string }[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select('SELECT * FROM tags');
  },

  async createTag(name: string, color = '#6366f1'): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute('INSERT INTO tags (name, color) VALUES (?, ?)', [name, color]);
  },

  // ── Activity ─────────────────────────────────────────────────────
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

  // ── Users ─────────────────────────────────────────────────────────
  async getUsers() {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(USER_QUERIES.getAll);
    return rows.map(row => ({
      id: String(row.id),
      name: String(row.name),
      email: String(row.email),
      role: String(row.role),
      permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions ?? ['all'],
      businessModules: typeof row.business_modules === 'string' ? JSON.parse(row.business_modules) : row.business_modules ?? ['Workspace', 'Utilities'],
      avatar: row.avatar ? String(row.avatar) : undefined,
    }));
  },

  async getUserByEmail(email: string) {
    const inst = await getDatabase();
    if (!inst) return null;
    const rows = await inst.select<Row>(USER_QUERIES.getByEmail, [email]);
    if (!rows.length) return null;
    const row = rows[0];
    return {
      id: String(row.id),
      name: String(row.name),
      email: String(row.email),
      role: String(row.role),
      permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions ?? ['all'],
      businessModules: typeof row.business_modules === 'string' ? JSON.parse(row.business_modules) : row.business_modules ?? ['Workspace', 'Utilities'],
      avatar: row.avatar ? String(row.avatar) : undefined,
    };
  },

  async createUser(data: { id: string; name: string; email: string; role?: string; permissions?: string[]; businessModules?: string[]; avatar?: string }) {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(USER_QUERIES.insert, [
      data.id,
      data.name,
      data.email,
      data.role ?? 'Administrator',
      JSON.stringify(data.permissions ?? ['all']),
      JSON.stringify(data.businessModules ?? ['Workspace', 'Utilities']),
      data.avatar ?? null,
    ]);
  },

  async ensureDefaultUser() {
    const users = await this.getUsers();
    if (users.length === 0) {
      await this.createUser({
        id: 'user_001',
        name: 'Developer',
        email: 'developer@localhost',
        role: 'Administrator',
        permissions: ['all'],
        businessModules: ['Workspace', 'Utilities'],
      });
    }
  },

  // ── Workflows ────────────────────────────────────────────────────
  async getWorkflows(): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(WORKFLOW_QUERIES.getAll);
    return rows.map(toWorkflow);
  },

  async getWorkflow(id: number): Promise<any | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    const rows = await inst.select<Row>(WORKFLOW_QUERIES.getById, [id]);
    return rows.length ? toWorkflow(rows[0]) : null;
  },

  async createWorkflow(data: { name: string; description?: string; steps?: string; tags?: string; favorite?: number; category?: string }): Promise<any | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    await inst.execute(WORKFLOW_QUERIES.insert, [
      data.name, data.description ?? '', data.steps ?? '[]',
      data.tags ?? '[]', data.favorite ?? 0, data.category ?? 'custom',
    ]);
    const rows = await inst.select<Row>(WORKFLOW_QUERIES.getAll);
    return rows.length ? toWorkflow(rows[rows.length - 1]) : null;
  },

  async updateWorkflow(id: number, data: any): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    const existing = await this.getWorkflow(id);
    if (!existing) return;
    const merged = { ...existing, ...data };
    await inst.execute(WORKFLOW_QUERIES.update, [
      merged.name, merged.description,
      typeof merged.steps === 'string' ? merged.steps : JSON.stringify(merged.steps),
      JSON.stringify(merged.tags), merged.favorite ? 1 : 0, merged.category, id,
    ]);
  },

  async deleteWorkflow(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(WORKFLOW_QUERIES.delete, [id]);
    await inst.execute(WORKFLOW_LOG_QUERIES.clearForWorkflow, [id]);
  },

  async toggleWorkflowFavorite(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(WORKFLOW_QUERIES.toggleFavorite, [id]);
  },

  async updateWorkflowLastRun(id: number, status: string): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(WORKFLOW_QUERIES.updateLastRun, [status, id]);
  },

  async searchWorkflows(query: string): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(WORKFLOW_QUERIES.search, [`%${query}%`, `%${query}%`]);
    return rows.map(toWorkflow);
  },

  // ── Workflow Logs ─────────────────────────────────────────────────
  async getWorkflowLogs(workflowId: number): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(WORKFLOW_LOG_QUERIES.getByWorkflow, [workflowId]);
    return rows.map(toWorkflowLog);
  },

  async getWorkflowLog(id: number): Promise<any | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    const rows = await inst.select<Row>(WORKFLOW_LOG_QUERIES.getById, [id]);
    return rows.length ? toWorkflowLog(rows[0]) : null;
  },

  async createWorkflowLog(workflowId: number, status: string = 'running', stepLogs: string = '[]'): Promise<any | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    await inst.execute(WORKFLOW_LOG_QUERIES.insert, [workflowId, status, stepLogs]);
    const rows = await inst.select<Row>(WORKFLOW_LOG_QUERIES.getByWorkflow, [workflowId]);
    return rows.length ? toWorkflowLog(rows[rows.length - 1]) : null;
  },

  async updateWorkflowLog(id: number, status: string, stepLogs: string): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(WORKFLOW_LOG_QUERIES.update, [status, stepLogs, id]);
  },

  // ── AI Conversations ──────────────────────────────────────────────
  async getAiConversations(): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(AI_CONVERSATION_QUERIES.getAll);
  },

  async getAiConversation(id: number): Promise<any | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    const rows = await inst.select(AI_CONVERSATION_QUERIES.getById, [id]);
    return rows.length ? rows[0] : null;
  },

  async createAiConversation(data: { title?: string; provider?: string; model?: string }): Promise<any | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    await inst.execute(AI_CONVERSATION_QUERIES.insert, [data.title ?? 'New Conversation', data.provider ?? '', data.model ?? '']);
    const rows = await inst.select(AI_CONVERSATION_QUERIES.getAll);
    return rows.length ? rows[0] : null;
  },

  async updateAiConversation(id: number, data: { title?: string; provider?: string; model?: string }): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(AI_CONVERSATION_QUERIES.update, [data.title, data.provider, data.model, id]);
  },

  async deleteAiConversation(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(AI_CONVERSATION_QUERIES.delete, [id]);
    await inst.execute(AI_MESSAGE_QUERIES.deleteByConversation, [id]);
  },

  // ── AI Messages ───────────────────────────────────────────────────
  async getAiMessages(conversationId: number): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(AI_MESSAGE_QUERIES.getByConversation, [conversationId]);
  },

  async createAiMessage(data: { conversation_id: number; role: string; content: string; tool_calls?: string }): Promise<any | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    await inst.execute(AI_MESSAGE_QUERIES.insert, [data.conversation_id, data.role, data.content, data.tool_calls ?? '[]']);
    const rows = await inst.select(AI_MESSAGE_QUERIES.getByConversation, [data.conversation_id]);
    return rows.length ? rows[rows.length - 1] : null;
  },

  // ── Analytics ─────────────────────────────────────────────────────
  async getAnalyticsSessions(): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(ANALYTICS_QUERIES.getAll);
  },

  async getAnalyticsByDateRange(from: string, to: string): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(ANALYTICS_QUERIES.getByDateRange, [from, to]);
  },

  async getAnalyticsToday(date: string): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(ANALYTICS_QUERIES.getToday, [date]);
  },

  async createAnalyticsSession(data: { date: string; duration_minutes: number; type?: string; label?: string }): Promise<any | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    await inst.execute(ANALYTICS_QUERIES.insert, [data.date, data.duration_minutes, data.type ?? 'focus', data.label ?? '']);
    const rows = await inst.select(ANALYTICS_QUERIES.getAll);
    return rows.length ? rows[0] : null;
  },

  async clearAnalytics(): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(ANALYTICS_QUERIES.delete);
  },

  // ── Backups ───────────────────────────────────────────────────────
  async getBackups(): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(BACKUP_QUERIES.getAll);
  },

  async getBackup(id: number): Promise<any | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    const rows = await inst.select(BACKUP_QUERIES.getById, [id]);
    return rows.length ? rows[0] : null;
  },

  async createBackup(data: { filename: string; size_bytes?: number; type?: string; encrypted?: number; notes?: string }): Promise<any | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    await inst.execute(BACKUP_QUERIES.insert, [data.filename, data.size_bytes ?? 0, data.type ?? 'manual', data.encrypted ?? 0, data.notes ?? '']);
    const rows = await inst.select(BACKUP_QUERIES.getAll);
    return rows.length ? rows[0] : null;
  },

  async deleteBackup(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(BACKUP_QUERIES.delete, [id]);
  },

  async clearBackups(): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(BACKUP_QUERIES.deleteAll);
  },

  // ── Data Export/Import for syncing between environments ──────────────
  async exportAllData() {
    return {
      projects: await this.getProjects(),
      notes: await this.getNotes(),
      folders: await this.getFolders(),
      snippets: await this.getSnippets(),
      bugs: await this.getBugs(),
      tags: await this.getTags(),
      settings: await this.getAllSettings(),
      notifications: await this.getNotifications(),
      users: await this.getUsers(),
    };
  },

  async importAllData(data: any) {
    const inst = await getDatabase();
    if (!inst) return;

    // Clear existing data
    await inst.execute('DELETE FROM projects');
    await inst.execute('DELETE FROM notes');
    await inst.execute('DELETE FROM folders');
    await inst.execute('DELETE FROM code_snippets');
    await inst.execute('DELETE FROM bugs');
    await inst.execute('DELETE FROM tags');
    await inst.execute('DELETE FROM settings');
    await inst.execute('DELETE FROM notifications');
    await inst.execute('DELETE FROM users');

    // Import projects
    for (const project of data.projects || []) {
      await inst.execute(PROJECT_QUERIES.insert, [
        project.name, project.description,
        JSON.stringify(project.tags), JSON.stringify(project.technology),
        project.repository_url, project.local_path,
      ]);
      const rows = await inst.select<Row>(PROJECT_QUERIES.getAll);
      const imported = rows[rows.length - 1];
      await inst.execute(PROJECT_QUERIES.update, [
        project.name, project.description, project.status,
        JSON.stringify(project.tags), JSON.stringify(project.technology),
        project.favorite ? 1 : 0, project.pinned ? 1 : 0,
        project.repository_url, project.local_path,
        JSON.stringify(project.scripts), JSON.stringify(project.environment),
        imported.id,
      ]);
    }

    // Import folders
    for (const folder of data.folders || []) {
      await inst.execute(FOLDER_QUERIES.insert, [folder.name, folder.parent_id, folder.icon]);
    }

    // Import notes
    for (const note of data.notes || []) {
      await inst.execute(NOTE_QUERIES.insert, [
        note.title, note.content, note.folder_id,
        JSON.stringify(note.tags), note.favorite ? 1 : 0, note.pinned ? 1 : 0, note.project_id,
      ]);
    }

    // Import snippets
    for (const snippet of data.snippets || []) {
      await inst.execute(SNIPPET_QUERIES.insert, [
        snippet.title, snippet.code, snippet.language,
        snippet.description, JSON.stringify(snippet.tags),
        snippet.favorite ? 1 : 0, snippet.project_id,
      ]);
    }

    // Import bugs
    for (const bug of data.bugs || []) {
      await inst.execute(BUG_QUERIES.insert, [
        bug.title, bug.problem, bug.solution,
        JSON.stringify(bug.tags), bug.project_id, bug.status,
      ]);
    }

    // Import tags
    for (const tag of data.tags || []) {
      await inst.execute('INSERT INTO tags (name, color) VALUES (?, ?)', [tag.name, tag.color]);
    }

    // Import settings
    for (const setting of data.settings || []) {
      await inst.execute(SETTINGS_QUERIES.set, [setting.key, setting.value]);
    }

    // Import notifications
    for (const notification of data.notifications || []) {
      await inst.execute(NOTIFICATION_QUERIES.insert, [notification.title, notification.message, notification.type]);
    }

    // Import users
    for (const user of data.users || []) {
      await inst.execute(USER_QUERIES.insert, [
        user.id, user.name, user.email, user.role,
        JSON.stringify(user.permissions), JSON.stringify(user.businessModules), user.avatar,
      ]);
    }
  },

  // ── Unified Knowledge / Library CRUD ─────────────────────────────

  async getKnowledgeItems(type?: string): Promise<KnowledgeItem[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const sql = type ? KNOWLEDGE_QUERIES.getByType(type) : KNOWLEDGE_QUERIES.getAll;
    const rows = await inst.select<Row>(sql);
    return rows.map(toKnowledgeItem);
  },

  async getKnowledgeItem(id: number): Promise<KnowledgeItem | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    const rows = await inst.select<Row>(KNOWLEDGE_QUERIES.getById, [id]);
    return rows.length ? toKnowledgeItem(rows[0]) : null;
  },

  async getKnowledgeByProject(projectId: number): Promise<KnowledgeItem[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(KNOWLEDGE_QUERIES.getByProject, [projectId]);
    return rows.map(toKnowledgeItem);
  },

  async getFavoriteKnowledge(): Promise<KnowledgeItem[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(KNOWLEDGE_QUERIES.getFavorites);
    return rows.map(toKnowledgeItem);
  },

  async getRecentKnowledge(limit = 10): Promise<KnowledgeItem[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(KNOWLEDGE_QUERIES.getRecent, [limit]);
    return rows.map(toKnowledgeItem);
  },

  async getTrashedKnowledge(): Promise<KnowledgeItem[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(KNOWLEDGE_QUERIES.getTrashed);
    return rows.map(toKnowledgeItem);
  },

  async createKnowledgeItem(data: {
    title: string; type: string; content?: string; description?: string;
    language?: string; url?: string; problem?: string; cause?: string; solution?: string;
    severity?: string; category?: string; tags?: string; favorite?: number; pinned?: number;
    status?: string; project_id?: number | null; folder_id?: number | null;
  }): Promise<KnowledgeItem | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    await inst.execute(KNOWLEDGE_QUERIES.insert, [
      data.title, data.type, data.content ?? '', data.description ?? '',
      data.language ?? '', data.url ?? '', data.problem ?? '', data.cause ?? '',
      data.solution ?? '', data.severity ?? '', data.category ?? '',
      data.tags ?? '[]', data.favorite ?? 0, data.pinned ?? 0,
      data.status ?? 'active', data.project_id ?? null, data.folder_id ?? null,
    ]);
    const rows = await inst.select<Row>(KNOWLEDGE_QUERIES.getAll);
    return rows.length ? toKnowledgeItem(rows[0]) : null;
  },

  async updateKnowledgeItem(id: number, data: Partial<KnowledgeItem>): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    const existing = await this.getKnowledgeItem(id);
    if (!existing) return;
    const merged = { ...existing, ...data };
    await inst.execute(KNOWLEDGE_QUERIES.update, [
      merged.title, merged.content, merged.description,
      merged.language, merged.url, merged.problem, merged.cause, merged.solution,
      merged.severity, merged.category, JSON.stringify(merged.tags),
      merged.favorite ? 1 : 0, merged.pinned ? 1 : 0,
      merged.status, merged.project_id, merged.folder_id, id,
    ]);
  },

  async deleteKnowledgeItem(id: number, permanent = false): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    if (permanent) await inst.execute(KNOWLEDGE_QUERIES.hardDelete, [id]);
    else await inst.execute(KNOWLEDGE_QUERIES.softDelete, [id]);
  },

  async restoreKnowledgeItem(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(KNOWLEDGE_QUERIES.restore, [id]);
  },

  async emptyKnowledgeTrash(): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(KNOWLEDGE_QUERIES.emptyTrash);
  },

  async toggleKnowledgeFavorite(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(KNOWLEDGE_QUERIES.toggleFavorite, [id]);
  },

  async toggleKnowledgePinned(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(KNOWLEDGE_QUERIES.togglePinned, [id]);
  },

  async updateKnowledgeLastOpened(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(KNOWLEDGE_QUERIES.updateLastOpened, [id]);
  },

  async searchKnowledge(query: string): Promise<KnowledgeItem[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const like = `%${query}%`;
    const rows = await inst.select<Row>(KNOWLEDGE_QUERIES.search, [like, like, like, like, like]);
    return rows.map(toKnowledgeItem);
  },

  async getKnowledgeCountByType(type: string): Promise<number> {
    const inst = await getDatabase();
    if (!inst) return 0;
    const rows = await inst.select<{ count: number }>(KNOWLEDGE_QUERIES.countByType(type));
    return rows[0]?.count ?? 0;
  },

  // ── Relations CRUD ───────────────────────────────────────────────

  async getRelatedKnowledge(id: number): Promise<KnowledgeItem[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(RELATION_QUERIES.getRelated, [id, id, id]);
    return rows.map(toKnowledgeItem);
  },

  async addRelation(sourceId: number, targetId: number, type = 'related'): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(RELATION_QUERIES.insert, [sourceId, targetId, type]);
  },

  async removeRelation(sourceId: number, targetId: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(RELATION_QUERIES.deletePair, [sourceId, targetId, targetId, sourceId]);
  },

  // ── Knowledge Folders CRUD ───────────────────────────────────────

  async getKnowledgeFolders(): Promise<KnowledgeItem['folder_id'][]> {
    const inst = await getDatabase();
    if (!inst) return [];
    const rows = await inst.select<Row>(KNOWLEDGE_FOLDER_QUERIES.getAll);
    return rows.map((r) => ({ id: Number(r.id), name: String(r.name), parent_id: r.parent_id ? Number(r.parent_id) : null, created_at: String(r.created_at ?? '') })) as any;
  },

  async createKnowledgeFolder(data: { name: string; parent_id?: number | null }): Promise<any> {
    const inst = await getDatabase();
    if (!inst) return null;
    await inst.execute(KNOWLEDGE_FOLDER_QUERIES.insert, [data.name, data.parent_id ?? null]);
    const rows = await inst.select<Row>(KNOWLEDGE_FOLDER_QUERIES.getAll);
    return rows.length ? { id: Number(rows[0].id), name: String(rows[0].name), parent_id: rows[0].parent_id ? Number(rows[0].parent_id) : null, created_at: String(rows[0].created_at ?? '') } : null;
  },

  async deleteKnowledgeFolder(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(KNOWLEDGE_FOLDER_QUERIES.delete, [id]);
  },

  // ── Insights ──────────────────────────────────────────────────────
  async logActivity(data: { project_id?: number; type: string; description: string; started_at?: string; ended_at?: string; duration?: number }): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(INSIGHTS_ACTIVITY_QUERIES.insert, [data.project_id ?? null, data.type, data.description, data.started_at ?? new Date().toISOString(), data.ended_at ?? null, data.duration ?? 0]);
  },

  async getActivityByRange(from: string, to: string): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(INSIGHTS_ACTIVITY_QUERIES.getByRange, [from, to]);
  },

  async getActivityByProject(projectId: number, limit = 20): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(INSIGHTS_ACTIVITY_QUERIES.getByProject, [projectId, limit]);
  },

  async upsertDailyStats(date: string, stats: { focus_time?: number; projects?: number; tasks?: number; commits?: number; notes?: number; bugs?: number }): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(INSIGHTS_DAILY_QUERIES.upsert, [date, stats.focus_time ?? 0, stats.projects ?? 0, stats.tasks ?? 0, stats.commits ?? 0, stats.notes ?? 0, stats.bugs ?? 0]);
  },

  async getDailyStatsByRange(from: string, to: string): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(INSIGHTS_DAILY_QUERIES.getByRange, [from, to]);
  },

  async getLatestDailyStats(limit = 7): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(INSIGHTS_DAILY_QUERIES.getLatest, [limit]);
  },

  async upsertProjectStats(projectId: number, stats: { total_time?: number; last_opened?: string; commits?: number; notes?: number; bugs?: number }): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(INSIGHTS_PROJECT_STATS_QUERIES.upsert, [projectId, stats.total_time ?? 0, stats.last_opened ?? null, stats.commits ?? 0, stats.notes ?? 0, stats.bugs ?? 0]);
  },

  async getAllProjectStats(): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(INSIGHTS_PROJECT_STATS_QUERIES.getAll);
  },

  async getProjectStats(projectId: number): Promise<any | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    const rows = await inst.select(INSIGHTS_PROJECT_STATS_QUERIES.getByProject, [projectId]);
    return rows.length ? rows[0] : null;
  },

  async getGoals(): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(INSIGHTS_GOAL_QUERIES.getAll);
  },

  async getActiveGoals(): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(INSIGHTS_GOAL_QUERIES.getActive);
  },

  async createGoal(data: { title: string; target?: number; progress?: number; deadline?: string; status?: string }): Promise<any | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    await inst.execute(INSIGHTS_GOAL_QUERIES.insert, [data.title, data.target ?? 100, data.progress ?? 0, data.deadline ?? null, data.status ?? 'active']);
    const rows = await inst.select(INSIGHTS_GOAL_QUERIES.getAll);
    return rows.length ? rows[rows.length - 1] : null;
  },

  async updateGoal(id: number, data: { title?: string; target?: number; progress?: number; deadline?: string; status?: string }): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    const existing = (await inst.select(INSIGHTS_GOAL_QUERIES.getAll)).find((g: any) => Number(g.id) === id);
    if (!existing) return;
    await inst.execute(INSIGHTS_GOAL_QUERIES.update, [data.title ?? existing.title, data.target ?? existing.target, data.progress ?? existing.progress, data.deadline ?? existing.deadline, data.status ?? existing.status, id]);
  },

  async deleteGoal(id: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(INSIGHTS_GOAL_QUERIES.delete, [id]);
  },

  // ── Utilities ─────────────────────────────────────────────────────
  async getTools(): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(TOOL_QUERIES.getAll);
  },

  async getToolsByCategory(category: string): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(TOOL_QUERIES.getByCategory, [category]);
  },

  async getFavoriteTools(): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(TOOL_QUERIES.getFavorites);
  },

  async toggleToolFavorite(toolId: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(TOOL_QUERIES.toggleFavorite, [toolId]);
  },

  async getRecentTools(limit = 20): Promise<any[]> {
    const inst = await getDatabase();
    if (!inst) return [];
    return inst.select(RECENT_TOOL_QUERIES.getRecent, [limit]);
  },

  async logToolUsage(toolId: number): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    const existing = await inst.select(RECENT_TOOL_QUERIES.getByToolId, [toolId]);
    if (existing.length > 0) {
      await inst.execute(RECENT_TOOL_QUERIES.updateTimestamp, [toolId]);
    } else {
      await inst.execute(RECENT_TOOL_QUERIES.insert, [toolId]);
    }
    await inst.execute(RECENT_TOOL_QUERIES.cleanOld);
  },

  async getToolSettings(toolId: number): Promise<any | null> {
    const inst = await getDatabase();
    if (!inst) return null;
    const rows = await inst.select(TOOL_SETTINGS_QUERIES.getByToolId, [toolId]);
    return rows.length ? rows[0] : null;
  },

  async saveToolSettings(toolId: number, settingsJson: string): Promise<void> {
    const inst = await getDatabase();
    if (!inst) return;
    await inst.execute(TOOL_SETTINGS_QUERIES.upsert, [toolId, settingsJson]);
  },
};
