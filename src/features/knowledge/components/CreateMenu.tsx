import { useState, useRef, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import { KNOWLEDGE_TYPES } from '../types';
import type { KnowledgeType } from '../types';

interface CreateMenuProps {
  onCreate: (type: KnowledgeType) => void;
}

export function CreateMenu({ onCreate }: CreateMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-4 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
        <FaPlus className="w-3.5 h-3.5" /> New
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-theme-surface border border-theme-border/30 rounded-2xl shadow-xl shadow-black/10 overflow-hidden z-50">
          <div className="p-2 space-y-0.5">
            {KNOWLEDGE_TYPES.map(opt => (
              <button key={opt.type} onClick={() => { onCreate(opt.type); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-theme-background/50 transition-colors text-left">
                <span className="text-lg">{opt.icon}</span>
                <div>
                  <p className="text-sm font-medium text-theme-text">{opt.label}</p>
                  <p className="text-[10px] text-theme-text/40">{opt.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
