import { FaFileAlt, FaStar, FaRegStar, FaThumbtack, FaRegTrashAlt } from 'react-icons/fa';
import type { Note } from '../types';

interface Props {
  note: Note;
  isSelected: boolean;
  onSelect: (note: Note) => void;
  onToggleFavorite: (id: number) => void;
  onTogglePinned: (id: number) => void;
  onDelete: (id: number) => void;
}

export function NoteCard({ note, isSelected, onSelect, onToggleFavorite, onTogglePinned, onDelete }: Props) {
  const preview = note.content.replace(/[#*`\[\]]/g, '').substring(0, 120);

  return (
    <div
      className={`group p-3 rounded-xl cursor-pointer border transition-all ${
        isSelected
          ? 'bg-theme-icon/10 border-theme-icon/30'
          : 'bg-theme-surface border-transparent hover:border-theme-border/30 hover:bg-theme-background/50'
      }`}
      onClick={() => onSelect(note)}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          note.favorite ? 'bg-yellow-400/10' : 'bg-theme-background/50'
        }`}>
          <FaFileAlt className={`w-4 h-4 ${note.favorite ? 'text-yellow-400' : 'text-theme-icon/60'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-theme-text truncate flex-1">{note.title || 'Untitled'}</h3>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={(e) => { e.stopPropagation(); onTogglePinned(note.id); }}
                className={`p-1 rounded transition-colors ${note.pinned ? 'text-yellow-400' : 'text-theme-text/30 hover:text-yellow-400'}`}>
                <FaThumbtack className="w-2.5 h-2.5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(note.id); }}
                className={`p-1 rounded transition-colors ${note.favorite ? 'text-yellow-400' : 'text-theme-text/30 hover:text-yellow-400'}`}>
                {note.favorite ? <FaStar className="w-3 h-3" /> : <FaRegStar className="w-3 h-3" />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                className="p-1 rounded text-theme-text/30 hover:text-red-400 transition-colors">
                <FaRegTrashAlt className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
          {preview && <p className="text-xs text-theme-text/40 mt-1 line-clamp-2">{preview}</p>}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-theme-text/30">{new Date(note.updated_at).toLocaleDateString()}</span>
            {note.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-theme-background/50 text-theme-text/40">#{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
