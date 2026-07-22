import { useState, useCallback } from 'react';
import { FaPlus, FaCode, FaBug, FaFileAlt, FaFolderPlus, FaSearch, FaTimes } from 'react-icons/fa';
import { database } from '../../../database';
import { FolderTree } from '../components/FolderTree';
import { NoteCard } from '../components/NoteCard';
import { NoteEditor } from '../components/NoteEditor';
import { SnippetCard } from '../components/SnippetCard';
import { SnippetForm } from '../components/SnippetForm';
import { BugCard } from '../components/BugCard';
import { BugForm } from '../components/BugForm';
import { useNotes, useFolders, useSnippets, useBugs } from '../hooks/useKnowledge';
import type { Note, CodeSnippet, Bug } from '../types';

type Tab = 'notes' | 'snippets' | 'bugs';

export function KnowledgePage() {
  const [tab, setTab] = useState<Tab>('notes');
  const [search, setSearch] = useState('');

  const { notes, loading: notesLoading, createNote, updateNote, deleteNote, refresh: refreshNotes } = useNotes();
  const { folders, createFolder, deleteFolder } = useFolders();
  const { snippets, loading: snippetsLoading, createSnippet, deleteSnippet, refresh: refreshSnippets } = useSnippets();
  const { bugs, loading: bugsLoading, createBug, deleteBug, refresh: refreshBugs } = useBugs();

  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const setSelectedBug = (_bug: Bug | null) => { /* reserved for detail panel */ };

  const [showSnippetForm, setShowSnippetForm] = useState(false);
  const [showBugForm, setShowBugForm] = useState(false);
  const [showAddFolderInput, setShowAddFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [addFolderParentId, setAddFolderParentId] = useState<number | null | undefined>(null);

  const q = search.toLowerCase();
  let filteredNotes: Note[] = notes;
  if (q) filteredNotes = notes.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  else if (selectedFolderId !== null) filteredNotes = notes.filter((n) => n.folder_id === selectedFolderId);

  let filteredSnippets: CodeSnippet[] = snippets;
  if (q) filteredSnippets = snippets.filter((s) => s.title.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));

  let filteredBugs: Bug[] = bugs;
  if (q) filteredBugs = bugs.filter((b) => b.title.toLowerCase().includes(q) || b.problem.toLowerCase().includes(q));

  const toggleNoteFavorite = useCallback(async (id: number) => {
    await database.toggleNoteFavorite(id);
    refreshNotes();
    if (selectedNote?.id === id) setSelectedNote((prev) => prev ? { ...prev, favorite: !prev.favorite } : null);
  }, [refreshNotes, selectedNote]);

  const toggleNotePinned = useCallback(async (id: number) => {
    await database.toggleNotePinned(id);
    refreshNotes();
    if (selectedNote?.id === id) setSelectedNote((prev) => prev ? { ...prev, pinned: !prev.pinned } : null);
  }, [refreshNotes, selectedNote]);

  const handleNoteSave = useCallback(async (id: number, data: Partial<Note>) => {
    await updateNote(id, data);
    setSelectedNote((prev) => prev ? { ...prev, ...data } : null);
  }, [updateNote]);

  const handleCreateNote = useCallback(async () => {
    const note = await createNote({
      title: 'Untitled Note',
      content: '',
      folder_id: selectedFolderId,
      tags: '[]',
    });
    if (note) setSelectedNote(note);
  }, [createNote, selectedFolderId]);

  const handleSnippetSave = useCallback(async (data: { title: string; code: string; language: string; description?: string; tags?: string }) => {
    await createSnippet(data as Parameters<typeof createSnippet>[0]);
    refreshSnippets();
  }, [createSnippet, refreshSnippets]);

  const handleBugSave = useCallback(async (data: { title: string; problem: string; solution?: string; tags?: string; status?: string }) => {
    await createBug(data as Parameters<typeof createBug>[0]);
    refreshBugs();
  }, [createBug, refreshBugs]);

  const handleAddFolder = useCallback((parentId?: number | null) => {
    setAddFolderParentId(parentId);
    setShowAddFolderInput(true);
    setNewFolderName('');
  }, []);

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;
    await createFolder({ name: newFolderName.trim(), parent_id: addFolderParentId ?? null });
    setNewFolderName('');
    setShowAddFolderInput(false);
  }, [newFolderName, addFolderParentId, createFolder]);

  const handleDeleteNote = useCallback(async (id: number) => {
    await deleteNote(id);
    if (selectedNote?.id === id) setSelectedNote(null);
  }, [deleteNote, selectedNote]);

  const handleDeleteSnippet = useCallback(async (id: number) => {
    await deleteSnippet(id);
  }, [deleteSnippet]);

  const handleDeleteBug = useCallback(async (id: number) => {
    await deleteBug(id);
    setSelectedBug(null);
  }, [deleteBug]);

  const handleDeleteFolder = useCallback(async (id: number) => {
    await deleteFolder(id);
    if (selectedFolderId === id) setSelectedFolderId(null);
  }, [deleteFolder, selectedFolderId]);

  const tabs: { id: Tab; label: string; icon: typeof FaFileAlt }[] = [
    { id: 'notes', label: 'Notes', icon: FaFileAlt },
    { id: 'snippets', label: 'Snippets', icon: FaCode },
    { id: 'bugs', label: 'Bugs', icon: FaBug },
  ];

  return (
    <div className="flex gap-6 h-[calc(100vh-10rem)]">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-theme-text/50 uppercase tracking-wider">Folders</h2>
          <button onClick={() => handleAddFolder(null)}
            className="p-1 rounded text-theme-text/30 hover:text-theme-text transition-colors" title="New folder">
            <FaFolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        {showAddFolderInput && (
          <div className="flex gap-1">
            <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} autoFocus placeholder="Folder name"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              className="flex-1 px-2 py-1 text-xs bg-theme-background border border-theme-border/30 rounded-lg text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50" />
            <button onClick={handleCreateFolder} className="px-2 py-1 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600">Add</button>
          </div>
        )}

        <FolderTree
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelect={setSelectedFolderId}
          onAddFolder={handleAddFolder}
          onDeleteFolder={handleDeleteFolder}
        />

        {/* Tags */}
        <div className="pt-4 border-t border-theme-border/10">
          <h2 className="text-xs font-semibold text-theme-text/50 uppercase tracking-wider mb-2">Tags</h2>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(new Set(notes.flatMap((n) => n.tags))).slice(0, 10).map((tag) => (
              <button key={tag} onClick={() => setSearch(tag)}
                className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors ${
                  search === tag ? 'bg-theme-icon/15 border-theme-icon/30 text-theme-icon' : 'border-theme-border/20 text-theme-text/40 hover:text-theme-text/60'
                }`}>
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tabs + Search */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 bg-theme-surface rounded-xl p-1 border border-theme-border/20">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => { setTab(t.id); setSelectedNote(null); setSelectedBug(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    tab === t.id ? 'bg-theme-icon/15 text-theme-text' : 'text-theme-text/40 hover:text-theme-text'
                  }`}>
                  <Icon className="w-3 h-3" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {tab === 'notes' && (
            <button onClick={handleCreateNote}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl hover:opacity-90 transition-opacity">
              <FaPlus className="w-3 h-3" /> New Note
            </button>
          )}
          {tab === 'snippets' && (
            <button onClick={() => setShowSnippetForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl hover:opacity-90 transition-opacity">
              <FaPlus className="w-3 h-3" /> New Snippet
            </button>
          )}
          {tab === 'bugs' && (
            <button onClick={() => setShowBugForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-red-500 to-purple-600 rounded-xl hover:opacity-90 transition-opacity">
              <FaPlus className="w-3 h-3" /> Report Bug
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-text/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${tab}...`}
            className="w-full pl-9 pr-9 py-2 bg-theme-surface border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text/30 hover:text-theme-text">
              <FaTimes className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {tab === 'notes' && (
            <div className="flex gap-4 h-full">
              {!selectedNote ? (
                <div className="flex-1 space-y-2">
                  {notesLoading ? (
                    <div className="space-y-2">{[1,2,3,4].map((i) => <div key={i} className="h-20 rounded-xl bg-theme-surface border border-theme-border/30 animate-pulse" />)}</div>
                  ) : filteredNotes.length === 0 ? (
                    <div className="text-center py-12">
                      <FaFileAlt className="w-10 h-10 text-theme-text/20 mx-auto mb-3" />
                      <p className="text-sm text-theme-text/40">No notes yet</p>
                      <button onClick={handleCreateNote} className="mt-3 text-xs text-theme-icon/70 hover:text-theme-icon underline underline-offset-2">
                        Create your first note
                      </button>
                    </div>
                  ) : (
                    filteredNotes.map((n) => {
                      const sel = Boolean(selectedNote) && selectedNote!.id === n.id;
                      return <NoteCard key={n.id} note={n} isSelected={sel}
                        onSelect={setSelectedNote}
                        onToggleFavorite={toggleNoteFavorite}
                        onTogglePinned={toggleNotePinned}
                        onDelete={handleDeleteNote} />;
                    })
                  )}
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <NoteEditor note={selectedNote} onSave={handleNoteSave} />
                </div>
              )}
            </div>
          )}

          {tab === 'snippets' && (
            <div className="space-y-3">
              {snippetsLoading ? (
                <div className="space-y-3">{[1,2].map((i) => <div key={i} className="h-32 rounded-2xl bg-theme-surface border border-theme-border/30 animate-pulse" />)}</div>
              ) : filteredSnippets.length === 0 ? (
                <div className="text-center py-12">
                  <FaCode className="w-10 h-10 text-theme-text/20 mx-auto mb-3" />
                  <p className="text-sm text-theme-text/40">No snippets yet</p>
                  <button onClick={() => setShowSnippetForm(true)} className="mt-3 text-xs text-theme-icon/70 hover:text-theme-icon underline underline-offset-2">
                    Create your first snippet
                  </button>
                </div>
              ) : (
                filteredSnippets.map((s) => (
                  <SnippetCard key={s.id} snippet={s}
                    onToggleFavorite={async (id) => { await database.toggleSnippetFavorite(id); refreshSnippets(); }}
                    onDelete={handleDeleteSnippet} />
                ))
              )}
            </div>
          )}

          {tab === 'bugs' && (
            <div className="space-y-3">
              {bugsLoading ? (
                <div className="space-y-3">{[1,2].map((i) => <div key={i} className="h-28 rounded-2xl bg-theme-surface border border-theme-border/30 animate-pulse" />)}</div>
              ) : filteredBugs.length === 0 ? (
                <div className="text-center py-12">
                  <FaBug className="w-10 h-10 text-theme-text/20 mx-auto mb-3" />
                  <p className="text-sm text-theme-text/40">No bugs tracked</p>
                </div>
              ) : (
                filteredBugs.map((b) => (
                  <BugCard key={b.id} bug={b} onSelect={setSelectedBug} onDelete={handleDeleteBug} />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <SnippetForm open={showSnippetForm} onClose={() => setShowSnippetForm(false)} onSave={handleSnippetSave} />
      <BugForm open={showBugForm} onClose={() => setShowBugForm(false)} onSave={handleBugSave} />
    </div>
  );
}
