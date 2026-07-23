import { useState } from 'react';

const WORDS = ['lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do','eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua','enim','ad','minim','veniam','quis','nostrud','exercitation','ullamco','laboris','nisi','aliquip','ex','ea','commodo','consequat','duis','aute','irure','reprehenderit','voluptate','velit','esse','cillum','eu','fugiat','nulla','pariatur','excepteur','sint','occaecat','cupidatat','non','proident','sunt','culpa','officia','deserunt','mollit','anim','id','est','laborum'];

const SENTENCES = [
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua',
  'ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat',
  'duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur',
  'excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum',
];

function rand(n: number) { return Math.floor(Math.random() * n); }

function genParagraphs(count: number): string {
  return Array.from({ length: count }, () => {
    const len = 3 + rand(5);
    return Array.from({ length: len }, () => {
      const s = SENTENCES[rand(SENTENCES.length)];
      const words = s.split(' ').slice(0, 6 + rand(10));
      return words.map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(' ') + '.';
    }).join(' ');
  }).join('\n\n');
}

function genWords(count: number): string {
  return Array.from({ length: count }, () => WORDS[rand(WORDS.length)]).join(' ');
}

export function LoremIpsum() {
  const [type, setType] = useState<'paragraphs' | 'words'>('paragraphs');
  const [count, setCount] = useState(3);
  const [output, setOutput] = useState('');

  const generate = () => {
    setOutput(type === 'paragraphs' ? genParagraphs(count) : genWords(count));
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50";
  const tb = (t: string) => `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${type === t ? 'bg-theme-icon/10 text-theme-icon border border-theme-icon/20' : 'bg-theme-surface border border-theme-border/20 text-theme-text/60 hover:text-theme-text'}`;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setType('paragraphs')} className={tb('paragraphs')}>Paragraphs</button>
        <button onClick={() => setType('words')} className={tb('words')}>Words</button>
      </div>
      <div className="flex gap-2 items-center">
        <label className="text-xs text-theme-text/60">Count: <input type="number" min={1} max={50} value={count} onChange={e => setCount(Number(e.target.value))} className="w-16 bg-theme-surface border border-theme-border/20 rounded-lg px-2 py-1 text-xs text-theme-text ml-1" /></label>
        <button onClick={generate} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">Generate</button>
      </div>
      {output && (
        <div>
          <textarea readOnly value={output} rows={8} className={ic} />
          <button onClick={() => navigator.clipboard.writeText(output)} className="mt-1 text-[10px] text-theme-icon hover:underline">Copy</button>
        </div>
      )}
    </div>
  );
}
