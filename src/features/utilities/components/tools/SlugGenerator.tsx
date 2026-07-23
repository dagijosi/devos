import { useState } from 'react';

export function SlugGenerator() {
  const [input, setInput] = useState('');
  const [slug, setSlug] = useState('');

  const generate = () => {
    setSlug(input.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    );
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50";

  return (
    <div className="space-y-4">
      <input value={input} onChange={e => setInput(e.target.value)} placeholder="Enter text to slugify..." className={ic} />
      <button onClick={generate} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">Generate Slug</button>
      {slug && (
        <div className="flex items-center gap-3 p-3 bg-theme-background rounded-lg">
          <code className="text-sm text-theme-text font-mono flex-1">{slug}</code>
          <button onClick={() => navigator.clipboard.writeText(slug)} className="text-[10px] px-2 py-1 rounded bg-theme-surface border border-theme-border/20 text-theme-text/60 hover:text-theme-icon">Copy</button>
        </div>
      )}
    </div>
  );
}
