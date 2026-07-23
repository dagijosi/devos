import { FaSearch, FaStar, FaTimes } from 'react-icons/fa';
import { useToolboxStore } from '../store/toolbox.store';

export function ToolSearch() {
  const { searchQuery, setSearchQuery, showFavoritesOnly, setShowFavoritesOnly } = useToolboxStore();

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tools... (Ctrl+F)"
          className="w-full bg-theme-surface border border-theme-border/30 rounded-xl pl-10 pr-10 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 focus:ring-1 focus:ring-theme-icon/30 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text/30 hover:text-theme-text/60 transition-colors"
          >
            <FaTimes className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <button
        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
          showFavoritesOnly
            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
            : 'bg-theme-surface text-theme-text/60 border-theme-border/30 hover:border-theme-border/60'
        }`}
      >
        <FaStar className="w-3.5 h-3.5" />
        Favorites
      </button>
    </div>
  );
}
