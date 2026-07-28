import { FaCode, FaStar, FaRegStar, FaRegCopy, FaRegTrashAlt, FaCheck } from 'react-icons/fa';
import { useState } from 'react';
import type { CodeSnippet } from '../types';
import { CodeBlock } from '../../../components/ui/CodeBlock';

interface Props {
  snippet: CodeSnippet;
  onToggleFavorite: (id: number) => void;
  onDelete: (id: number) => void;
}

export function SnippetCard({ snippet, onToggleFavorite, onDelete }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-theme-surface border border-theme-border/30 rounded-2xl overflow-hidden group">
      <div className="flex items-center justify-between px-4 py-3 border-b border-theme-border/10">
        <div className="flex items-center gap-2 min-w-0">
          <FaCode className="w-3.5 h-3.5 text-theme-icon/60 flex-shrink-0" />
          <h3 className="text-sm font-medium text-theme-text truncate">{snippet.title}</h3>
          <span className="px-1.5 py-0.5 text-[10px] rounded-md font-medium bg-blue-500/10 text-blue-400 flex-shrink-0">{snippet.language}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleCopy}
            className="p-1.5 rounded-lg text-theme-text/30 hover:text-theme-text transition-colors" title="Copy">
            {copied ? <FaCheck className="w-3 h-3 text-green-400" /> : <FaRegCopy className="w-3 h-3" />}
          </button>
          <button onClick={() => onToggleFavorite(snippet.id)}
            className={`p-1.5 rounded-lg transition-colors ${snippet.favorite ? 'text-yellow-400' : 'text-theme-text/30 hover:text-yellow-400'}`}>
            {snippet.favorite ? <FaStar className="w-3 h-3" /> : <FaRegStar className="w-3 h-3" />}
          </button>
          <button onClick={() => onDelete(snippet.id)}
            className="p-1.5 rounded-lg text-theme-text/30 hover:text-red-400 transition-colors">
            <FaRegTrashAlt className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="px-4 py-3">
        <CodeBlock code={snippet.code} language={snippet.language} maxHeight="288px" showLineNumbers />
      </div>
      {snippet.description && (
        <div className="px-4 py-2 border-t border-theme-border/10">
          <p className="text-[11px] text-theme-text/40">{snippet.description}</p>
        </div>
      )}
    </div>
  );
}
