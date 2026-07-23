import { useState, useEffect } from 'react';
import { FaStar, FaRegStar, FaThumbtack, FaCode, FaBug, FaBook, FaRobot, FaFileAlt, FaBookmark, FaClipboardList, FaExternalLinkAlt, FaFolder } from 'react-icons/fa';
import { database } from '../../../database';
import type { KnowledgeItem } from '../types';
import type { Project } from '../../projects/types';

const TYPE_ICONS: Record<string, React.ElementType> = {
  note: FaFileAlt, bug: FaBug, snippet: FaCode, prompt: FaRobot, doc: FaBook, bookmark: FaBookmark, template: FaClipboardList,
};

const TYPE_COLORS: Record<string, string> = {
  note: 'text-sky-400', bug: 'text-red-400', snippet: 'text-emerald-400', prompt: 'text-purple-400',
  doc: 'text-indigo-400', bookmark: 'text-amber-400', template: 'text-teal-400',
};

interface KnowledgeCardProps {
  item: KnowledgeItem;
  selected: boolean;
  onSelect: (item: KnowledgeItem) => void;
  onToggleFavorite: (id: number) => void;
  projectName?: string;
}

export function KnowledgeCard({ item, selected, onSelect, onToggleFavorite, projectName }: KnowledgeCardProps) {
  const Icon = TYPE_ICONS[item.type] || FaFileAlt;
  const color = TYPE_COLORS[item.type] || 'text-theme-text/50';
  const snippet = (item.content || item.description || item.problem || '').slice(0, 120);
  const tagList = (item.tags || []).slice(0, 3);

  return (
    <div onClick={() => onSelect(item)}
      className={`group relative p-4 rounded-2xl border cursor-pointer transition-all ${
        selected
          ? 'bg-theme-icon/8 border-theme-icon/30'
          : 'bg-theme-surface border-theme-border/20 hover:border-theme-border/40 hover:shadow-sm'
      }`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl bg-theme-background/50 flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-theme-text truncate">{item.title}</h3>
            <span className={`text-[10px] uppercase font-medium ${color}`}>{item.type}</span>
          </div>
          {snippet && <p className="text-xs text-theme-text/40 mt-1 line-clamp-2">{snippet}</p>}
          <div className="flex items-center gap-2 mt-2">
            {item.project_id && projectName && (
              <span className="flex items-center gap-1 text-[10px] text-theme-text/40 bg-theme-icon/8 px-1.5 py-0.5 rounded-full">
                <FaFolder className="w-2 h-2" />{projectName}
              </span>
            )}
            {tagList.map(t => <span key={t} className="text-[10px] text-theme-text/30">#{t}</span>)}
            {item.type === 'bookmark' && item.url && <FaExternalLinkAlt className="w-2.5 h-2.5 text-theme-text/20 ml-auto" />}
          </div>
        </div>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={e => { e.stopPropagation(); onToggleFavorite(item.id); }}
          className={`p-1 rounded ${item.favorite ? 'text-yellow-400' : 'text-theme-text/20 hover:text-yellow-400'}`}>
          {item.favorite ? <FaStar className="w-3 h-3" /> : <FaRegStar className="w-3 h-3" />}
        </button>
        {item.pinned && <FaThumbtack className="w-2.5 h-2.5 text-theme-text/30" />}
      </div>
    </div>
  );
}
