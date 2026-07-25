import { useMemo, useState } from 'react';
import { FaSearch, FaCode, FaFileAlt, FaCog } from 'react-icons/fa';
import type { GeneratedFile } from '../types';

interface Props {
  files: GeneratedFile[];
  activeFile: string | null;
  onSelectFile: (name: string) => void;
}

export function FileExplorer({ files, activeFile, onSelectFile }: Props) {
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-theme-text/20">
        <FaCog className="w-8 h-8 mb-2" />
        <p className="text-xs">Generate types to see files</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <div className="text-[10px] font-semibold text-theme-text/30 uppercase tracking-wider px-3 pb-2">Generated Files</div>
      {files.map(f => (
        <button key={f.filename} onClick={() => onSelectFile(f.filename)}
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors text-left ${
            activeFile === f.filename
              ? 'bg-theme-icon/10 text-theme-icon font-medium'
              : 'text-theme-text/60 hover:text-theme-text/80 hover:bg-theme-surface/50'
          }`}>
          <FaFileAlt className="w-3 h-3 shrink-0" />
          <span className="truncate">{f.filename}</span>
        </button>
      ))}
    </div>
  );
}

interface PreviewProps {
  file: GeneratedFile | null;
  onCopy: () => void;
  onDownload: () => void;
  onRegenerate: () => void;
}

export function TypePreview({ file, onCopy, onDownload, onRegenerate }: PreviewProps) {
  const [search, setSearch] = useState('');

  const highlighted = useMemo(() => {
    if (!file) return '';
    let code = file.content;
    if (search.trim()) {
      const parts = code.split(new RegExp(`(${escapeRegex(search.trim())})`, 'gi'));
      return parts.map(p =>
        p.toLowerCase() === search.trim().toLowerCase()
          ? `<mark class="bg-yellow-400/20 text-yellow-300">${p}</mark>`
          : escapeHtml(p)
      ).join('');
    }
    return syntaxHighlight(code);
  }, [file, search]);

  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-theme-text/20">
        <FaCode className="w-10 h-10 mb-3" />
        <p className="text-xs">Select a file to preview</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-theme-border/10">
        <div className="relative flex-1">
          <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-theme-text/20" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search in code..." className="w-full bg-theme-background border border-theme-border/20 rounded-lg pl-7 pr-3 py-1.5 text-[10px] font-mono text-theme-text outline-none placeholder:text-theme-text/20" />
        </div>
        <button onClick={onCopy} className="px-2.5 py-1.5 text-[10px] text-theme-text/50 hover:text-theme-icon transition-colors rounded-lg hover:bg-theme-surface/50">Copy</button>
        <button onClick={onDownload} className="px-2.5 py-1.5 text-[10px] text-theme-text/50 hover:text-theme-icon transition-colors rounded-lg hover:bg-theme-surface/50">Download</button>
        <button onClick={onRegenerate} className="px-2.5 py-1.5 text-[10px] text-theme-text/50 hover:text-theme-icon transition-colors rounded-lg hover:bg-theme-surface/50">Regenerate</button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="text-xs font-mono leading-relaxed whitespace-pre" dangerouslySetInnerHTML={{ __html: highlighted }} />
      </div>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function syntaxHighlight(code: string): string {
  const marked = code
    .replace(/\b(export|import|from|interface|type|extends|const|let|function|return|async|await)\b/g, '<kw>$1</kw>')
    .replace(/\b(string|number|boolean|null|undefined|void|any|never|unknown)\b/g, '<type>$1</type>')
    .replace(/"([^"]*)"/g, '<str>"$1"</str>')
    .replace(/'([^']*)'/g, "<str>'$1'</str>")
    .replace(/(\b[A-Z][a-zA-Z0-9]*\b)(?=\s*[{<])/g, '<cls>$1</cls>')
    .replace(/\/\/.*/g, '<cmt>$&</cmt>')
    .replace(/([{}[\]();:])/g, '<pct>$1</pct>');
  const escaped = escapeHtml(marked);
  return escaped
    .replace(/&lt;kw&gt;/g, '<span class="text-purple-400">')
    .replace(/&lt;\/kw&gt;/g, '</span>')
    .replace(/&lt;type&gt;/g, '<span class="text-blue-400">')
    .replace(/&lt;\/type&gt;/g, '</span>')
    .replace(/&lt;str&gt;/g, '<span class="text-amber-400">')
    .replace(/&lt;\/str&gt;/g, '</span>')
    .replace(/&lt;cls&gt;/g, '<span class="text-yellow-300">')
    .replace(/&lt;\/cls&gt;/g, '</span>')
    .replace(/&lt;cmt&gt;/g, '<span class="text-green-500/60">')
    .replace(/&lt;\/cmt&gt;/g, '</span>')
    .replace(/&lt;pct&gt;/g, '<span class="text-theme-text/40">')
    .replace(/&lt;\/pct&gt;/g, '</span>');
}
