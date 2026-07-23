import { useState, useCallback } from 'react';
import { FaCopy, FaCheck } from 'react-icons/fa';

type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

const algorithms: HashAlgorithm[] = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

async function computeHash(text: string, algorithm: HashAlgorithm): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function HashGenerator() {
  const [input, setInput] = useState('');
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>('SHA-256');
  const [hash, setHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    if (!input.trim()) { setHash(''); return; }
    setLoading(true);
    try {
      const result = await computeHash(input, algorithm);
      setHash(result);
    } catch {
      setHash('Error computing hash');
    } finally {
      setLoading(false);
    }
  }, [input, algorithm]);

  const copyHash = async () => {
    if (hash) {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-theme-text/70 mb-1.5 block">Input Text</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          placeholder="Enter text to hash..."
          className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 font-mono resize-y"
        />
      </div>

      <div className="flex items-center gap-3">
        <select
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value as HashAlgorithm)}
          className="bg-theme-background border border-theme-border/30 rounded-xl px-3 py-2.5 text-sm text-theme-text outline-none focus:border-theme-icon/50"
        >
          {algorithms.map(a => (
            <option key={a} value={a}>{a.replace('-', '-')}</option>
          ))}
        </select>
        <button
          onClick={generate}
          disabled={loading || !input.trim()}
          className="px-5 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Computing...' : 'Generate Hash'}
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-theme-text/70">Hash ({algorithm.replace('-', '-')})</label>
          {hash && (
            <button onClick={copyHash} className="flex items-center gap-1 text-xs text-theme-text/40 hover:text-theme-text/70">
              {copied ? <FaCheck className="w-3 h-3 text-green-400" /> : <FaCopy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
        <div className="bg-theme-background border border-theme-border/20 rounded-xl p-4 text-xs text-theme-text/80 font-mono break-all min-h-[40px]">
          {hash || 'Enter text and click generate'}
        </div>
      </div>
    </div>
  );
}
