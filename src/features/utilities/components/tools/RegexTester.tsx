import { useState, useMemo, useEffect } from 'react';

interface MatchResult {
  full: string;
  groups: string[];
  index: number;
}

const STORAGE_KEY = 'devos-tool-regex';

function loadRegexState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function RegexTester() {
  const saved = loadRegexState();
  const [pattern, setPattern] = useState(saved?.pattern || '');
  const [flags, setFlags] = useState<{ g: boolean; i: boolean; m: boolean; s: boolean }>(saved?.flags || { g: true, i: false, m: false, s: false });
  const [testText, setTestText] = useState(saved?.testText || '');
  const [error, setError] = useState('');

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ pattern, flags, testText })); } catch {}
  }, [pattern, flags, testText]);

  const flagString = useMemo(() =>
    Object.entries(flags).filter(([, v]) => v).map(([k]) => k).join(''),
    [flags]
  );

  const matches = useMemo(() => {
    if (!pattern.trim() || !testText) return [];
    setError('');
    try {
      void pattern;
      const results: MatchResult[] = [];
      let match: RegExpExecArray | null;
      const global = flagString.includes('g');
      const re = global ? new RegExp(pattern, flagString) : new RegExp(pattern, flagString);

      if (global) {
        while ((match = re.exec(testText)) !== null) {
          results.push({
            full: match[0],
            groups: match.slice(1),
            index: match.index,
          });
          if (match.index === re.lastIndex) re.lastIndex++;
        }
      } else {
        match = re.exec(testText);
        if (match) {
          results.push({
            full: match[0],
            groups: match.slice(1),
            index: match.index,
          });
        }
      }
      return results;
    } catch (err: any) {
      setError(err.message || 'Invalid regex');
      return [];
    }
  }, [pattern, flagString, testText]);

  const toggleFlag = (flag: keyof typeof flags) => {
    setFlags(prev => ({ ...prev, [flag]: !prev[flag] }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-theme-text/70 mb-1.5 block">Pattern</label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-theme-text/30 font-mono">/</span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="[a-z]+"
              className="w-full bg-theme-background border border-theme-border/30 rounded-xl pl-8 pr-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 font-mono"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-theme-text/30 font-mono">/{flagString}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {(['g', 'i', 'm', 's'] as const).map((flag) => (
          <label key={flag} className="flex items-center gap-1.5 text-xs text-theme-text/60 cursor-pointer">
            <input
              type="checkbox"
              checked={flags[flag]}
              onChange={() => toggleFlag(flag)}
              className="rounded border-theme-border/30 text-theme-icon focus:ring-theme-icon/30"
            />
            {flag}
          </label>
        ))}
      </div>

      <div>
        <label className="text-sm font-medium text-theme-text/70 mb-1.5 block">Test String</label>
        <textarea
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          rows={6}
          placeholder="Enter text to test against..."
          className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 font-mono resize-y"
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">{error}</div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-theme-text/70">Matches ({matches.length})</label>
        </div>
        {matches.length > 0 ? (
          <div className="space-y-1.5">
            {matches.map((m, i) => (
              <div key={i} className="bg-theme-background border border-theme-border/20 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-theme-text/30 font-mono w-16 flex-shrink-0">#{i + 1} @{m.index}</span>
                  <span className="text-sm text-theme-text/90 font-mono truncate">{m.full}</span>
                </div>
                {m.groups.length > 0 && (
                  <div className="mt-1.5 pl-[4.5rem] space-y-0.5">
                    {m.groups.map((g, gi) => (
                      <div key={gi} className="text-xs text-theme-text/50 font-mono">
                        <span className="text-theme-text/30">${gi + 1}: </span>{g}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-theme-background border border-theme-border/20 rounded-xl p-4 text-center text-sm text-theme-text/30">
            {pattern ? 'No matches found' : 'Enter a pattern and test string to see matches'}
          </div>
        )}
      </div>
    </div>
  );
}
