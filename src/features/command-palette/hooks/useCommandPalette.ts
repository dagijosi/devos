import { useEffect, useCallback, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../stores/app.store';
import { database } from '../../../database';
import { DASHBOARD, PROJECTS, KNOWLEDGE, UTILITIES, WORKFLOWS, SETTING, SNIPPETS } from '../../../routes/types/routeConstants';
import type { Project } from '../../projects/types';
import type { Note, CodeSnippet } from '../../knowledge/types';
import allTools from '../../utilities/toolDefinitions';
import { useUtilitiesStore } from '../../utilities/store/utilities.store';

interface Command {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  icon?: string;
  action: () => void;
  category?: string;
}

export function useCommandPalette() {
  const navigate = useNavigate();
  const { commandPaletteOpen, setCommandPaletteOpen, toggleCommandPalette } = useAppStore();
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [loadedProjects, loadedNotes, loadedSnippets] = await Promise.all([
        database.getProjects(),
        database.getNotes(),
        database.getSnippets(),
      ]);
      setProjects(loadedProjects);
      setNotes(loadedNotes);
      setSnippets(loadedSnippets);
    };
    loadData();
  }, []);

  const { favoriteTools } = useUtilitiesStore();

  const TOP_TOOL_IDS = ['json-formatter', 'base64', 'jwt-decoder', 'regex-tester', 'api-tester', 'timestamp-converter', 'telegram-connector'];

  const baseCommands: Command[] = [
    { id: 'go-dashboard', label: 'Go to Dashboard', description: 'Navigate to the dashboard', category: 'Navigation', action: () => navigate(DASHBOARD) },
    { id: 'go-projects', label: 'Go to Projects', description: 'View and manage projects', category: 'Navigation', action: () => navigate(PROJECTS) },
    { id: 'go-knowledge', label: 'Go to Knowledge', description: 'Browse documentation and guides', category: 'Navigation', action: () => navigate(KNOWLEDGE) },
    { id: 'go-utilities', label: 'Go to Utilities', description: 'Access developer utilities', category: 'Navigation', action: () => navigate(UTILITIES) },
    { id: 'go-workflows', label: 'Go to Workflows', description: 'Manage automation workflows', category: 'Navigation', action: () => navigate(WORKFLOWS) },
    { id: 'go-settings', label: 'Open Settings', description: 'Configure application settings', category: 'Navigation', action: () => navigate(SETTING) },
    { id: 'toggle-sidebar', label: 'Toggle Sidebar', description: 'Show or hide the sidebar', shortcut: 'Ctrl+B', category: 'View', action: () => useAppStore.getState().toggleSidebar() },
    { id: 'toggle-theme', label: 'Toggle Theme', description: 'Switch between light and dark mode', category: 'Preferences', action: () => {
      const current = localStorage.getItem('app-theme-id') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('app-theme-id', next);
      useAppStore.getState().setThemeMode(next as any);
      window.dispatchEvent(new CustomEvent('app-theme-change'));
    }},
  ];

  const toolCommands: Command[] = useMemo(() => {
    const ids = [...new Set([...favoriteTools, ...TOP_TOOL_IDS])];
    return ids.map(id => {
      const def = allTools.find(t => t.id === id);
      if (!def) return null;
      return {
        id: `tool-${def.id}`,
        label: def.name,
        description: def.description,
        category: 'Utilities',
        action: () => navigate(`${UTILITIES}?tool=${def.id}`),
      };
    }).filter(Boolean) as Command[];
  }, [favoriteTools, navigate]);

  const projectCommands: Command[] = projects.map((p) => ({
    id: `project-${p.id}`,
    label: p.name,
    description: `Project • ${p.status}`,
    category: 'Projects',
    action: () => navigate(`${PROJECTS}/${p.id}`),
  }));

  const noteCommands: Command[] = notes.map((n) => ({
    id: `note-${n.id}`,
    label: n.title,
    description: n.type === 'bug' ? 'Bug Report' : n.type === 'doc' ? 'Document' : 'Note',
    category: 'Knowledge',
    action: () => navigate(`${KNOWLEDGE}?item=${n.id}`),
  }));

  const snippetCommands: Command[] = snippets.map((s) => ({
    id: `snippet-${s.id}`,
    label: s.title,
    description: `Snippet • ${s.language || 'code'}`,
    category: 'Snippets',
    action: () => navigate(`${SNIPPETS}?item=${s.id}`),
  }));

  const commands = [...baseCommands, ...toolCommands, ...projectCommands, ...noteCommands, ...snippetCommands];

  const filteredCommands = query
    ? commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(query.toLowerCase()) ||
          cmd.description?.toLowerCase().includes(query.toLowerCase()) ||
          cmd.category?.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  const executeCommand = useCallback(
    (command: Command) => {
      setCommandPaletteOpen(false);
      setQuery('');
      command.action();
    },
    [setCommandPaletteOpen]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
        setQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, toggleCommandPalette, setCommandPaletteOpen]);

  return {
    isOpen: commandPaletteOpen,
    query,
    setQuery,
    filteredCommands,
    executeCommand,
    close: () => {
      setCommandPaletteOpen(false);
      setQuery('');
    },
  };
}
