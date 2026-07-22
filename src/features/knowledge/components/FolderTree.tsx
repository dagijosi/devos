import { useState } from 'react';
import { FaFolder, FaFolderOpen, FaChevronRight, FaChevronDown, FaPlus, FaRegTrashAlt } from 'react-icons/fa';
import type { Folder } from '../types';

interface Props {
  folders: Folder[];
  selectedFolderId: number | null;
  onSelect: (id: number | null) => void;
  onAddFolder: (parentId?: number | null) => void;
  onDeleteFolder: (id: number) => void;
}

function FolderItem({ folder, folders, depth, selectedFolderId, onSelect, onAddFolder, onDeleteFolder }: {
  folder: Folder;
  folders: Folder[];
  depth: number;
} & Omit<Props, 'folders'>) {
  const [expanded, setExpanded] = useState(true);
  const children = folders.filter((f) => f.parent_id === folder.id);
  const isSelected = selectedFolderId === folder.id;

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors group ${
          isSelected ? 'bg-theme-icon/15 text-theme-text font-medium' : 'text-theme-text/60 hover:text-theme-text hover:bg-theme-background/50'
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => onSelect(folder.id)}
      >
        {children.length > 0 ? (
          <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="p-0.5">
            {expanded ? <FaChevronDown className="w-2.5 h-2.5" /> : <FaChevronRight className="w-2.5 h-2.5" />}
          </button>
        ) : <span className="w-3" />}
        {expanded ? <FaFolderOpen className="w-3.5 h-3.5 text-yellow-400/70" /> : <FaFolder className="w-3.5 h-3.5 text-yellow-400/70" />}
        <span className="truncate flex-1">{folder.name}</span>
        <button onClick={(e) => { e.stopPropagation(); onAddFolder(folder.id); }}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-theme-background/50 text-theme-text/30 hover:text-theme-text transition-all">
          <FaPlus className="w-2.5 h-2.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-theme-text/30 hover:text-red-400 transition-all">
          <FaRegTrashAlt className="w-2.5 h-2.5" />
        </button>
      </div>
      {expanded && children.map((child) => (
        <FolderItem key={child.id} folder={child} folders={folders} depth={depth + 1}
          selectedFolderId={selectedFolderId} onSelect={onSelect} onAddFolder={onAddFolder} onDeleteFolder={onDeleteFolder} />
      ))}
    </div>
  );
}

export function FolderTree({ folders, selectedFolderId, onSelect, onAddFolder, onDeleteFolder }: Props) {
  const rootFolders = folders.filter((f) => !f.parent_id);

  return (
    <div className="space-y-0.5">
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors ${
          selectedFolderId === null ? 'bg-theme-icon/15 text-theme-text font-medium' : 'text-theme-text/60 hover:text-theme-text hover:bg-theme-background/50'
        }`}
        onClick={() => onSelect(null)}
      >
        <FaFolderOpen className="w-3.5 h-3.5 text-theme-icon/70" />
        <span>All Notes</span>
      </div>
      {rootFolders.map((folder) => (
        <FolderItem key={folder.id} folder={folder} folders={folders} depth={0}
          selectedFolderId={selectedFolderId} onSelect={onSelect} onAddFolder={onAddFolder} onDeleteFolder={onDeleteFolder} />
      ))}
    </div>
  );
}
