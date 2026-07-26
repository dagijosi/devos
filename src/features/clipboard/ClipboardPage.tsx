import { useEffect, useState } from 'react';
import { FaCopy, FaSearch, FaTrash, FaStar, FaRegStar, FaClipboard, FaTimes } from 'react-icons/fa';
import { useClipboardStore } from './clipboard.store';
import LoadingComponent from '../../components/ui/feedback/LoadingComponent';
import { EmptyState } from '../../components/ui/feedback/EmptyState';
import { toast } from 'sonner';

export function ClipboardPage() {
  const { entries, searchQuery, loading, loadEntries, setSearchQuery, searchEntries, deleteEntry, clearAll, toggleFavorite } = useClipboardStore();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    searchEntries(value);
  };

  const copyToClipboard = async (content: string, id: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const truncate = (text: string, max = 200) =>
    text.length > max ? text.slice(0, max) + '...' : text;

  if (loading) return <LoadingComponent />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-theme-text">Clipboard History</h1>
        {entries.length > 0 && (
          <button
            onClick={clearAll}
            className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text/40 w-4 h-4" />
        <input
          type="text"
          placeholder="Search clipboard history..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-theme-surface/50 border border-theme-border/20 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/40 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text/40 hover:text-theme-text/70"
          >
            <FaTimes className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={<FaClipboard className="w-8 h-8" />}
          title="No clipboard entries"
          description="Copy something to start building your clipboard history"
        />
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="group flex items-start gap-3 p-3 bg-theme-surface/30 border border-theme-border/10 rounded-xl hover:bg-theme-surface/50 transition-all"
            >
              <button
                onClick={() => toggleFavorite(entry.id)}
                className="mt-1 shrink-0 text-theme-text/30 hover:text-yellow-400 transition-colors"
                title={entry.favorite ? 'Unfavorite' : 'Favorite'}
              >
                {entry.favorite ? <FaStar className="w-3.5 h-3.5 text-yellow-400" /> : <FaRegStar className="w-3.5 h-3.5" />}
              </button>

              <div className="flex-1 min-w-0">
                <pre className="text-sm text-theme-text font-mono whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                  {truncate(entry.content)}
                </pre>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-theme-text/40">
                  <span>{new Date(entry.created_at).toLocaleString()}</span>
                  {entry.source && <span>via {entry.source}</span>}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => copyToClipboard(entry.content, entry.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    copiedId === entry.id
                      ? 'bg-green-500/20 text-green-400'
                      : 'text-theme-text/40 hover:text-theme-icon hover:bg-theme-surface/50'
                  }`}
                  title="Copy"
                >
                  {copiedId === entry.id ? (
                    <span className="text-xs font-medium">Copied!</span>
                  ) : (
                    <FaCopy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="p-2 rounded-lg text-theme-text/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  title="Delete"
                >
                  <FaTrash className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
