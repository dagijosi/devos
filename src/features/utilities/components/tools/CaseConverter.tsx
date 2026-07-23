import { useState } from 'react';

export function CaseConverter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const convert = (type: string) => {
    switch (type) {
      case 'upper': setOutput(input.toUpperCase()); break;
      case 'lower': setOutput(input.toLowerCase()); break;
      case 'title': setOutput(input.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())); break;
      case 'camel': setOutput(input.replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase()).replace(/^[A-Z]/, c => c.toLowerCase())); break;
      case 'pascal': setOutput(input.replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase()).replace(/^[a-z]/, c => c.toUpperCase())); break;
      case 'snake': setOutput(input.replace(/([A-Z])/g, '_$1').replace(/[\s-]+/g, '_').toLowerCase().replace(/^_/, '')); break;
      case 'kebab': setOutput(input.replace(/([A-Z])/g, '-$1').replace(/[\s_]+/g, '-').toLowerCase().replace(/^-/, '')); break;
      case 'sentence': setOutput(input.charAt(0).toUpperCase() + input.slice(1).toLowerCase().replace(/([.!?]\s*)([a-z])/g, (_, p, c) => p + c.toUpperCase())); break;
    }
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50";
  const cs = "px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-surface border border-theme-border/20 text-theme-text/60 hover:text-theme-text hover:bg-theme-border/10 transition-colors";

  return (
    <div className="space-y-4">
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={4} placeholder="Enter text to convert..." className={ic} />
      <div className="flex flex-wrap gap-1.5">
        {['UPPER', 'lower', 'Title', 'camelCase', 'PascalCase', 'snake_case', 'kebab-case', 'Sentence case'].map(name => {
          const key = name.toLowerCase().replace(/[^a-z]/g, '');
          return <button key={key} onClick={() => convert(key)} className={cs}>{name}</button>;
        })}
      </div>
      {output && <textarea readOnly value={output} rows={4} className={ic} />}
    </div>
  );
}
