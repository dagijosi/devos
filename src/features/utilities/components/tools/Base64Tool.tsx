import { useState, useCallback } from 'react';
import { FaCopy, FaCheck, FaArrowsAltH } from 'react-icons/fa';

export function Base64Tool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const process = useCallback(() => {
    setError('');
    if (!input.trim()) { setOutput(''); return; }

    try {
      if (mode === 'encode') {
        setOutput(btoa(unescape(encodeURIComponent(input))));
      } else {
        setOutput(decodeURIComponent(escape(atob(input))));
      }
    } catch (err: any) {
      setError(mode === 'decode' ? 'Invalid Base64 input' : 'Encoding failed');
      setOutput('');
    }
  }, [input, mode]);

  const toggleMode = () => {
    setMode(prev => prev === 'encode' ? 'decode' : 'encode');
    setInput(output);
    setOutput('');
    setError('');
  };

  const copyOutput = async () => {
    if (output) {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-sm font-medium text-theme-text/70 mb-1.5 block">
            {mode === 'encode' ? 'Text to Encode' : 'Base64 to Decode'}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 to decode...'}
            className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 font-mono resize-y"
          />
        </div>
        <button
          onClick={toggleMode}
          className="mt-6 p-2.5 rounded-xl bg-theme-surface border border-theme-border/30 hover:bg-theme-surface/80 transition-colors"
          title={`Switch to ${mode === 'encode' ? 'decode' : 'encode'}`}
        >
          <FaArrowsAltH className="w-4 h-4 text-theme-text/60" />
        </button>
      </div>

      <button onClick={process} className="px-5 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors">
        {mode === 'encode' ? 'Encode' : 'Decode'}
      </button>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">{error}</div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-theme-text/70">Result</label>
          {output && (
            <button onClick={copyOutput} className="flex items-center gap-1 text-xs text-theme-text/40 hover:text-theme-text/70">
              {copied ? <FaCheck className="w-3 h-3 text-green-400" /> : <FaCopy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
        <textarea
          value={output}
          readOnly
          rows={5}
          className="w-full bg-theme-background border border-theme-border/20 rounded-xl px-4 py-2.5 text-sm text-theme-text/80 font-mono resize-y"
        />
      </div>
    </div>
  );
}
