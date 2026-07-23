import { useState, useMemo } from 'react';

export function WordCounter() {
  const [text, setText] = useState('');
  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, '').length;
    const lines = text ? text.split('\n').length : 0;
    const paragraphs = text ? text.split(/\n\s*\n/).filter(p => p.trim()).length : 0;
    const sentences = text ? text.split(/[.!?]+/).filter(s => s.trim()).length : 0;
    return { words, chars, charsNoSpace, lines, paragraphs, sentences };
  }, [text]);

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50";

  return (
    <div className="space-y-4">
      <textarea value={text} onChange={e => setText(e.target.value)} rows={10} placeholder="Type or paste text here..." className={ic} />
      <div className="grid grid-cols-3 gap-3">
        {[
          ['Words', stats.words], ['Characters', stats.chars], ['No Spaces', stats.charsNoSpace],
          ['Lines', stats.lines], ['Paragraphs', stats.paragraphs], ['Sentences', stats.sentences],
        ].map(([label, value]) => (
          <div key={label} className="bg-theme-background border border-theme-border/20 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-theme-text">{value}</p>
            <p className="text-[10px] text-theme-text/40">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
