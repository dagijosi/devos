import { useState, useCallback, useEffect } from 'react';
import { FaCopy, FaCheck } from 'react-icons/fa';

const STORAGE_KEY = 'devos-tool-json-input';

export function JsonFormatter() {
  const [input, setInput] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; }
  });
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, input); } catch {}
  }, [input]);

  const format = useCallback(() => {
    setError('');
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
    } catch (err: any) {
      setError(err.message || 'Invalid JSON');
      setOutput('');
    }
  }, [input]);

  const minify = useCallback(() => {
    setError('');
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
    } catch (err: any) {
      setError(err.message || 'Invalid JSON');
      setOutput('');
    }
  }, [input]);

  const copyOutput = async () => {
    if (output) {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-theme-text/70 mb-1.5 block">Input</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          placeholder='{"key": "value", "nested": [1, 2, 3]}'
          className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 font-mono resize-y"
        />
      </div>

      <div className="flex gap-2">
        <button onClick={format} className="px-5 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors">
          Format
        </button>
        <button onClick={minify} className="px-5 py-2 bg-theme-surface border border-theme-border/50 text-theme-text rounded-xl text-sm font-medium hover:bg-theme-surface/80 transition-colors">
          Minify
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-theme-text/70">Output</label>
          {output && (
            <button onClick={copyOutput} className="flex items-center gap-1 text-xs text-theme-text/40 hover:text-theme-text/70 transition-colors">
              {copied ? <FaCheck className="w-3 h-3 text-green-400" /> : <FaCopy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
        <pre className="w-full bg-theme-background border border-theme-border/20 rounded-xl p-4 text-sm text-theme-text/80 font-mono whitespace-pre-wrap overflow-auto max-h-96 min-h-[100px]">
          {output || 'Waiting for input...'}
        </pre>
      </div>
    </div>
  );
}
