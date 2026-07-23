import { useState, useMemo } from 'react';

function mdToHtml(md: string): string {
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-theme-icon underline">$1</a>')
    .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-2" />')
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-theme-background rounded-lg p-3 text-xs overflow-x-auto my-2"><code>$2</code></pre>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br/>');
  return '<p>' + html + '</p>';
}

export function MarkdownPreview() {
  const [input, setInput] = useState('# Hello\nType **markdown** here');
  const html = useMemo(() => mdToHtml(input), [input]);

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50 font-mono";

  return (
    <div className="grid grid-cols-2 gap-4 h-[400px]">
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={16} placeholder="Enter Markdown..." className={ic} />
      <div className="bg-theme-surface border border-theme-border/20 rounded-lg p-4 text-xs text-theme-text overflow-y-auto prose-custom"
        dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
