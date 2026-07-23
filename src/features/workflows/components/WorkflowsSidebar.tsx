import { FaSearch, FaTimes, FaStar, FaClock, FaThLarge, FaPlus } from 'react-icons/fa';
import { CATEGORIES, CATEGORY_LABELS } from '../types';

interface SidebarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeCategory: string | null;
  onCategoryChange: (cat: string | null) => void;
  showFavoritesOnly: boolean;
  onToggleFavorites: () => void;
  showRecentOnly: boolean;
  onToggleRecent: () => void;
  onNewWorkflow: () => void;
}

export function WorkflowsSidebar({
  searchQuery, onSearchChange, activeCategory, onCategoryChange,
  showFavoritesOnly, onToggleFavorites, showRecentOnly, onToggleRecent, onNewWorkflow,
}: SidebarProps) {
  return (
    <div className="w-56 shrink-0 space-y-4">
      <button
        onClick={onNewWorkflow}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors"
      >
        <FaPlus className="w-3.5 h-3.5" />
        New Workflow
      </button>

      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-text/30" />
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search workflows..."
          className="w-full bg-theme-surface border border-theme-border/20 rounded-xl pl-9 pr-8 py-2.5 text-xs text-theme-text placeholder:text-theme-text/30 outline-none focus:border-theme-icon/50 transition-colors"
        />
        {searchQuery && (
          <button onClick={() => onSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-theme-text/30 hover:text-theme-text">
            <FaTimes className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="space-y-0.5">
        <button onClick={() => { onCategoryChange(null); onToggleFavorites(); }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${showFavoritesOnly ? 'bg-amber-500/10 text-amber-400 font-medium' : 'text-theme-text/50 hover:text-theme-text hover:bg-theme-background/50'}`}
        ><FaStar className="w-3.5 h-3.5" /> Favorites</button>
        <button onClick={() => { onCategoryChange(null); onToggleRecent(); }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${showRecentOnly ? 'bg-theme-icon/10 text-theme-icon font-medium' : 'text-theme-text/50 hover:text-theme-text hover:bg-theme-background/50'}`}
        ><FaClock className="w-3.5 h-3.5" /> Recent</button>
      </div>

      <div className="border-t border-theme-border/10 pt-3">
        <p className="text-[10px] text-theme-text/30 uppercase tracking-wider px-3 mb-2">Categories</p>
        <div className="space-y-0.5">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => onCategoryChange(activeCategory === cat ? null : cat)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                activeCategory === cat
                  ? 'bg-theme-icon/10 text-theme-icon font-medium'
                  : 'text-theme-text/50 hover:text-theme-text hover:bg-theme-background/50'
              }`}
            >{CATEGORY_LABELS[cat] || cat}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
