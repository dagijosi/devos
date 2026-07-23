import { useState, useEffect, useRef, useCallback } from 'react';

interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function MarkdownEditor({ value, onChange, placeholder = 'Write in markdown...', minHeight = '300px' }: MarkdownEditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = value.slice(0, start);
      const after = value.slice(end);
      onChange(before + '  ' + after);
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 2; });
    }
  }, [value, onChange]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const insert = (before: string, after = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = ta.value;
    onChange(text.slice(0, start) + before + text.slice(start, end) + after + text.slice(end));
    requestAnimationFrame(() => {
      ta.selectionStart = start + before.length;
      ta.selectionEnd = end + before.length;
      ta.focus();
    });
  };

  const toolbar = [
    { label: 'B', action: () => insert('**', '**'), title: 'Bold' },
    { label: 'I', action: () => insert('*', '*'), title: 'Italic' },
    { label: 'H2', action: () => insert('## '), title: 'Heading' },
    { label: '•', action: () => insert('- '), title: 'List' },
    { label: '1.', action: () => insert('1. '), title: 'Numbered' },
    { label: '[]', action: () => insert('- [ ] '), title: 'Checklist' },
    { label: '``', action: () => insert('`', '`'), title: 'Code' },
    { label: '```', action: () => insert('```\n', '\n```'), title: 'Code block' },
    { label: '🔗', action: () => insert('[', '](url)'), title: 'Link' },
    { label: '📷', action: () => insert('![alt](', ')'), title: 'Image' },
    { label: '📊', action: () => insert('```mermaid\n', '\n```'), title: 'Mermaid' },
  ];

  return (
    <div className="border border-theme-border/20 rounded-2xl overflow-hidden bg-theme-surface">
      <div className="flex items-center justify-between px-3 py-2 border-b border-theme-border/10">
        <div className="flex items-center gap-0.5 flex-wrap">
          {toolbar.map(t => (
            <button key={t.label} onClick={() => setTab === null ? null : t.action()} onMouseDown={e => { e.preventDefault(); t.action(); }}
              className="px-2 py-1 text-xs rounded-lg text-theme-text/40 hover:text-theme-text hover:bg-theme-background/50 transition-colors font-mono"
              title={t.title}>{t.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-theme-background/50 rounded-lg p-0.5">
          <button onClick={() => setTab('write')} className={`px-3 py-1 text-xs rounded-md transition-colors ${tab === 'write' ? 'bg-theme-surface text-theme-text shadow-sm' : 'text-theme-text/40'}`}>Write</button>
          <button onClick={() => setTab('preview')} className={`px-3 py-1 text-xs rounded-md transition-colors ${tab === 'preview' ? 'bg-theme-surface text-theme-text shadow-sm' : 'text-theme-text/40'}`}>Preview</button>
        </div>
      </div>
      {tab === 'write' ? (
        <textarea ref={textareaRef} value={value} onChange={e => onChange(e.target.value)} onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent px-4 py-3 text-sm text-theme-text placeholder:text-theme-text/30 outline-none resize-none font-mono leading-relaxed"
          style={{ minHeight }} />
      ) : (
        <div className="px-4 py-3 text-sm text-theme-text/80 leading-relaxed prose prose-invert max-w-none min-h-[200px] whitespace-pre-wrap">
          {value || <span className="text-theme-text/30">Nothing to preview</span>}
        </div>
      )}
    </div>
  );
}
