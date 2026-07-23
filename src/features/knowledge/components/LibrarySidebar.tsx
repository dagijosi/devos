import { FaStar, FaClock, FaTrash, FaBook, FaBug, FaCode, FaRobot, FaFileAlt, FaBookmark, FaClipboardList } from 'react-icons/fa';
import type { KnowledgeType } from '../types';

export const CATEGORIES: { type: KnowledgeType | 'favorites' | 'recent' | 'trash'; label: string; icon: React.ElementType; color: string }[] = [
  { type: 'favorites', label: 'Favorites', icon: FaStar, color: 'text-yellow-400' },
  { type: 'recent', label: 'Recent', icon: FaClock, color: 'text-blue-400' },
  { type: 'note', label: 'Notes', icon: FaFileAlt, color: 'text-sky-400' },
  { type: 'bug', label: 'Bugs', icon: FaBug, color: 'text-red-400' },
  { type: 'snippet', label: 'Snippets', icon: FaCode, color: 'text-emerald-400' },
  { type: 'prompt', label: 'Prompts', icon: FaRobot, color: 'text-purple-400' },
  { type: 'doc', label: 'Docs', icon: FaBook, color: 'text-indigo-400' },
  { type: 'bookmark', label: 'Bookmarks', icon: FaBookmark, color: 'text-amber-400' },
  { type: 'template', label: 'Templates', icon: FaClipboardList, color: 'text-teal-400' },
  { type: 'trash', label: 'Trash', icon: FaTrash, color: 'text-red-500/60' },
];

interface LibrarySidebarProps {
  activeCategory: string | null;
  onCategory: (type: string | null) => void;
  counts: Record<string, number>;
}

export function LibrarySidebar({ activeCategory, onCategory, counts }: LibrarySidebarProps) {
  return (
    <div className="w-56 shrink-0 space-y-1">
      {CATEGORIES.map(cat => {
        const Icon = cat.icon;
        const isActive = activeCategory === cat.type || (!activeCategory && cat.type === 'favorites');
        const count = counts[cat.type] ?? 0;
        return (
          <button key={cat.type} onClick={() => onCategory(cat.type)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
              isActive ? 'bg-theme-icon/10 text-theme-icon font-medium' : 'text-theme-text/50 hover:text-theme-text/80 hover:bg-theme-surface/50'
            }`}>
            <Icon className={`w-4 h-4 ${cat.color}`} />
            <span className="flex-1 text-left">{cat.label}</span>
            {count > 0 && <span className="text-[10px] text-theme-text/30 tabular-nums">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
