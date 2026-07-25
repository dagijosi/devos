import { useState, useEffect, useCallback } from 'react';
import { database } from '../../../database';
import type { Note, Folder, CodeSnippet, Bug } from '../types';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await database.getNotes();
    setNotes(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createNote = useCallback(async (data: Parameters<typeof database.createNote>[0]) => {
    const created = await database.createNote(data);
    if (created) {
      await database.addActivity('note', created.id, 'created', `Note "${created.title}" created`);
      await database.logActivity({ type: 'note', description: `Created note: "${created.title}"`, project_id: created.project_id ?? undefined });
      setNotes((prev) => [created, ...prev]);
    }
    return created;
  }, []);

  const updateNote = useCallback(async (id: number, data: Partial<Note>) => {
    await database.updateNote(id, data);
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...data, updated_at: new Date().toISOString() } : n)));
  }, []);

  const deleteNote = useCallback(async (id: number) => {
    await database.deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notes, loading, createNote, updateNote, deleteNote, refresh: load };
}

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await database.getFolders();
    setFolders(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createFolder = useCallback(async (data: { name: string; parent_id?: number | null }) => {
    const created = await database.createFolder(data);
    if (created) setFolders((prev) => [...prev, created]);
    return created;
  }, []);

  const deleteFolder = useCallback(async (id: number) => {
    await database.deleteFolder(id);
    setFolders((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return { folders, loading, createFolder, deleteFolder, refresh: load };
}

export function useSnippets() {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await database.getSnippets();
    setSnippets(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createSnippet = useCallback(async (data: Parameters<typeof database.createSnippet>[0]) => {
    const created = await database.createSnippet(data);
    if (created) {
      await database.addActivity('snippet', created.id, 'created', `Snippet "${created.title}" created`);
      await database.logActivity({ type: 'snippet', description: `Created snippet: "${created.title}"`, project_id: created.project_id ?? undefined });
      setSnippets((prev) => [created, ...prev]);
    }
    return created;
  }, []);

  const deleteSnippet = useCallback(async (id: number) => {
    await database.deleteSnippet(id);
    setSnippets((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { snippets, loading, createSnippet, deleteSnippet, refresh: load };
}

export function useBugs() {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await database.getBugs();
    setBugs(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createBug = useCallback(async (data: Parameters<typeof database.createBug>[0]) => {
    const created = await database.createBug(data);
    if (created) {
      await database.addActivity('bug', created.id, 'created', `Bug "${created.title}" created`);
      await database.logActivity({ type: 'bug', description: `Created bug: "${created.title}"`, project_id: created.project_id ?? undefined });
      setBugs((prev) => [created, ...prev]);
    }
    return created;
  }, []);

  const deleteBug = useCallback(async (id: number) => {
    await database.deleteBug(id);
    setBugs((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return { bugs, loading, createBug, deleteBug, refresh: load };
}
