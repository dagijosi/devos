import { useState, useRef, useEffect, useMemo } from 'react';
import { FaSearch, FaTimes, FaStar, FaClock, FaThLarge } from 'react-icons/fa';
import { CATEGORY_LABELS, type ToolCategory } from '../types';
import { useUtilitiesStore } from '../store/utilities.store';
import allTools from '../toolDefinitions';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ToolCategory[];

export function UtilitiesSidebar() {
  const { searchQuery, setSearchQuery, activeCategory, setActiveCategory, showFavoritesOnly, setShowFavoritesOnly, showRecentOnly, setShowRecentOnly, favoriteTools } = useUtilitiesStore();
  const [searchFocused, setSearchFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of allTools) {
      counts[t.category] = (counts[t.category] || 0) + 1;
    }
    return counts;
  }, []);

  const isAll = !activeCategory && !showFavoritesOnly && !showRecentOnly && !searchQuery;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="w-56 shrink-0 space-y-4">
      <div className={`relative flex items-center bg-theme-surface border rounded-xl transition-colors ${searchFocused ? 'border-theme-icon/50' : 'border-theme-border/20'}`}>
        <FaSearch className="absolute left-3 w-3.5 h-3.5 text-theme-text/30" />
        <input
          ref={inputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search tools..."
          className="w-full bg-transparent pl-9 pr-8 py-2.5 text-xs text-theme-text placeholder:text-theme-text/30 outline-none"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-2 p-0.5 text-theme-text/30 hover:text-theme-text">
            <FaTimes className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="space-y-0.5">
        <button
          onClick={() => { setActiveCategory(null); setShowFavoritesOnly(false); setShowRecentOnly(false); setSearchQuery(''); }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${isAll ? 'bg-theme-icon/10 text-theme-icon font-medium' : 'text-theme-text/50 hover:text-theme-text hover:bg-theme-background/50'}`}
        >
          <FaThLarge className="w-3.5 h-3.5" /> All Tools
        </button>
        <button
          onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setShowRecentOnly(false); setActiveCategory(null); }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${showFavoritesOnly ? 'bg-amber-500/10 text-amber-400 font-medium' : 'text-theme-text/50 hover:text-theme-text hover:bg-theme-background/50'}`}
        >
          <FaStar className="w-3.5 h-3.5" /> Favorites <span className="ml-auto text-[10px] text-theme-text/30">{favoriteTools.length}</span>
        </button>
        <button
          onClick={() => { setShowRecentOnly(!showRecentOnly); setShowFavoritesOnly(false); setActiveCategory(null); }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${showRecentOnly ? 'bg-theme-icon/10 text-theme-icon font-medium' : 'text-theme-text/50 hover:text-theme-text hover:bg-theme-background/50'}`}
        >
          <FaClock className="w-3.5 h-3.5" /> Recent
        </button>
      </div>

      <div className="border-t border-theme-border/10 pt-3">
        <p className="text-[10px] text-theme-text/30 uppercase tracking-wider px-3 mb-2">Categories</p>
        <div className="space-y-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`w-full flex items-center px-3 py-1.5 rounded-lg text-xs transition-colors ${
                activeCategory === cat
                  ? 'bg-theme-icon/10 text-theme-icon font-medium'
                  : 'text-theme-text/50 hover:text-theme-text hover:bg-theme-background/50'
              }`}
            >
              <span>{CATEGORY_LABELS[cat]}</span>
              <span className="ml-auto text-[10px] text-theme-text/30">{categoryCounts[cat] || 0}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
