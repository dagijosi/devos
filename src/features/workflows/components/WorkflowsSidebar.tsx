import { useState, useEffect } from 'react';
import { FaSearch, FaTimes, FaStar, FaClock, FaPlus, FaCode, FaGlobe, FaCog } from 'react-icons/fa';
import { CATEGORIES, CATEGORY_LABELS } from '../types';
import { loadPrefs, savePrefs, EDITOR_OPTIONS, BROWSER_OPTIONS, type ToolPrefs } from '../toolPrefs';

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
  const [prefs, setPrefs] = useState<ToolPrefs>(loadPrefs);
  const [showPrefs, setShowPrefs] = useState(false);

  useEffect(() => { savePrefs(prefs); }, [prefs]);

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-2 py-1.5 text-[11px] text-theme-text outline-none focus:border-theme-icon/50";

  return (
    <div className="w-56 shrink-0 space-y-4">
      <button onClick={onNewWorkflow} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors">
        <FaPlus className="w-3.5 h-3.5" /> New Workflow
      </button>

      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-text/30" />
        <input value={searchQuery} onChange={e => onSearchChange(e.target.value)} placeholder="Search workflows..."
          className="w-full bg-theme-surface border border-theme-border/20 rounded-xl pl-9 pr-8 py-2.5 text-xs text-theme-text placeholder:text-theme-text/30 outline-none focus:border-theme-icon/50 transition-colors"
        />
        {searchQuery && <button onClick={() => onSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-theme-text/30 hover:text-theme-text"><FaTimes className="w-3 h-3" /></button>}
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
                activeCategory === cat ? 'bg-theme-icon/10 text-theme-icon font-medium' : 'text-theme-text/50 hover:text-theme-text hover:bg-theme-background/50'
              }`}
            >{CATEGORY_LABELS[cat] || cat}</button>
          ))}
        </div>
      </div>

      <div className="border-t border-theme-border/10 pt-3">
        <button onClick={() => setShowPrefs(!showPrefs)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-theme-text/50 hover:text-theme-text hover:bg-theme-background/50 w-full transition-colors">
          <FaCog className="w-3 h-3" /> Tool Preferences {showPrefs ? '▾' : '▸'}
        </button>
        {showPrefs && (
          <div className="mt-2 px-3 space-y-3">
            <div>
              <label className="flex items-center gap-1.5 text-[10px] text-theme-text/40 mb-1"><FaCode className="w-2.5 h-2.5" /> Editor</label>
              <select value={prefs.editor.type} onChange={e => {
                const opt = EDITOR_OPTIONS.find(o => o.type === e.target.value);
                setPrefs(p => ({ ...p, editor: { type: e.target.value, path: opt?.command || '', label: opt?.label || 'Custom' } }));
              }} className={ic}>
                {EDITOR_OPTIONS.map(o => <option key={o.type} value={o.type}>{o.label}</option>)}
              </select>
              {prefs.editor.type === 'custom' && (
                <input type="text" value={prefs.editor.path} onChange={e => setPrefs(p => ({ ...p, editor: { ...p.editor, path: e.target.value, label: e.target.value || 'Custom' } }))}
                  placeholder="Path to editor executable" className={`${ic} mt-1`} />
              )}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[10px] text-theme-text/40 mb-1"><FaGlobe className="w-2.5 h-2.5" /> Browser</label>
              <select value={prefs.browser.type} onChange={e => {
                const opt = BROWSER_OPTIONS.find(o => o.type === e.target.value);
                setPrefs(p => ({ ...p, browser: { type: e.target.value, path: opt?.command || '', label: opt?.label || 'Custom' } }));
              }} className={ic}>
                {BROWSER_OPTIONS.map(o => <option key={o.type} value={o.type}>{o.label}</option>)}
              </select>
              {prefs.browser.type === 'custom' && (
                <input type="text" value={prefs.browser.path} onChange={e => setPrefs(p => ({ ...p, browser: { ...p.browser, path: e.target.value, label: e.target.value || 'Custom' } }))}
                  placeholder="Path to browser executable" className={`${ic} mt-1`} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
