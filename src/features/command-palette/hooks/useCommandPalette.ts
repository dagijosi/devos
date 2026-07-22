import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../stores/app.store';
import { database } from '../../../database';
import { DASHBOARD, PROJECTS, KNOWLEDGE, TOOLBOX, AUTOMATION, SETTING } from '../../../routes/types/routeConstants';
import type { Project } from '../../projects/types';
import type { Note } from '../../knowledge/types';

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

  useEffect(() => {
    const loadData = async () => {
      const [loadedProjects, loadedNotes] = await Promise.all([
        database.getProjects(),
        database.getNotes(),
      ]);
      setProjects(loadedProjects);
      setNotes(loadedNotes);
    };
    loadData();
  }, []);

  const baseCommands: Command[] = [
    { id: 'go-dashboard', label: 'Go to Dashboard', description: 'Navigate to the dashboard', category: 'Navigation', action: () => navigate(DASHBOARD) },
    { id: 'go-projects', label: 'Go to Projects', description: 'View and manage projects', category: 'Navigation', action: () => navigate(PROJECTS) },
    { id: 'go-knowledge', label: 'Go to Knowledge', description: 'Browse documentation and guides', category: 'Navigation', action: () => navigate(KNOWLEDGE) },
    { id: 'go-toolbox', label: 'Go to Toolbox', description: 'Access developer utilities', category: 'Navigation', action: () => navigate(TOOLBOX) },
    { id: 'go-automation', label: 'Go to Automation', description: 'Manage workflows', category: 'Navigation', action: () => navigate(AUTOMATION) },
    { id: 'go-settings', label: 'Open Settings', description: 'Configure application settings', category: 'Navigation', action: () => navigate(SETTING) },
    { id: 'toggle-sidebar', label: 'Toggle Sidebar', description: 'Show or hide the sidebar', shortcut: 'Ctrl+B', category: 'View', action: () => useAppStore.getState().toggleSidebar() },
    { id: 'toggle-theme', label: 'Toggle Theme', description: 'Switch between light and dark mode', category: 'Preferences', action: () => {
      const settings = JSON.parse(localStorage.getItem('developer-os-settings') || '{}');
      const newTheme = settings.state?.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('developer-os-settings', JSON.stringify({ ...settings, state: { ...settings.state, theme: newTheme } }));
      window.location.reload();
    }},
  ];

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
    description: 'Note',
    category: 'Knowledge',
    action: () => {
      navigate(KNOWLEDGE);
      // Could add logic to select the specific note
    },
  }));

  const commands = [...baseCommands, ...projectCommands, ...noteCommands];

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
