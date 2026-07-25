import { useCommandPalette } from '../hooks/useCommandPalette';
import { motion, AnimatePresence } from 'framer-motion';
import { Portal } from '../../../components/ui/overlays';
import { useEffect, useRef, useState } from 'react';

export function CommandPalette() {
  const { isOpen, query, setQuery, filteredCommands, executeCommand, close } =
    useCommandPalette();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev: number) => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev: number) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredCommands.length > 0) {
        e.preventDefault();
        executeCommand(filteredCommands[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, executeCommand]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex > 0) {
      const items = listRef.current.querySelectorAll('button');
      const selectedItem = items[selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-full max-w-xl"
          >
            <div className="bg-theme-surface border border-theme-border/40 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center px-4 border-b border-theme-border/20">
                <svg className="w-5 h-5 text-theme-text/40 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search commands..."
                  className="flex-1 bg-transparent text-theme-text placeholder-theme-text/40 py-4 text-sm outline-none"
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-theme-text/40 bg-theme-background rounded border border-theme-border/20">
                  ESC
                </kbd>
              </div>

              <div className="max-h-80 overflow-y-auto p-2" ref={listRef}>
                {filteredCommands.length === 0 ? (
                  <div className="text-center py-8 text-theme-text/40 text-sm">
                    No results found
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredCommands.map((cmd, index) => (
                      <button
                        key={cmd.id}
                        onClick={() => executeCommand(cmd)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group ${
                          index === selectedIndex ? 'bg-theme-background/50' : 'hover:bg-theme-background/50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-theme-background/50 border border-theme-border/20 flex items-center justify-center text-theme-text/40 group-hover:text-theme-text transition-colors flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-theme-text">{cmd.label}</div>
                          {cmd.description && (
                            <div className="text-xs text-theme-text/40 truncate">{cmd.description}</div>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-theme-text/40 bg-theme-background rounded border border-theme-border/20 flex-shrink-0">
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-4 py-2 border-t border-theme-border/20 bg-theme-background/50 flex items-center gap-4 text-xs text-theme-text/40">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-theme-surface rounded border border-theme-border/20">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-theme-surface rounded border border-theme-border/20">↵</kbd>
                  Open
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-theme-surface rounded border border-theme-border/20">Esc</kbd>
                  Close
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return <Portal>{content}</Portal>;
}
