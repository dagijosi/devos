import { useState, useCallback } from 'react';
import { FaCopy, FaCheck } from 'react-icons/fa';

function base64UrlDecode(str: string): string {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    return atob(padded);
  } catch {
    return '';
  }
}

function formatJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

export function JwtDecoder() {
  const [token, setToken] = useState('');
  const [header, setHeader] = useState('');
  const [payload, setPayload] = useState('');
  const [signature, setSignature] = useState('');
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState('');

  const decode = useCallback(() => {
    setError('');
    setHeader('');
    setPayload('');
    setSignature('');

    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      setError('Invalid JWT format. Expected 3 dot-separated parts.');
      return;
    }

    try {
      const decodedHeader = base64UrlDecode(parts[0]);
      const decodedPayload = base64UrlDecode(parts[1]);
      setHeader(formatJson(decodedHeader));
      setPayload(formatJson(decodedPayload));
      setSignature(parts[2]);
    } catch {
      setError('Failed to decode JWT. Ensure the token is valid.');
    }
  }, [token]);

  const copyField = async (field: string, value: string) => {
    if (value) {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-theme-text/70 mb-1.5 block">JWT Token</label>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          rows={3}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 font-mono resize-y"
        />
      </div>

      <button onClick={decode} className="px-5 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors">
        Decode
      </button>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">{error}</div>
      )}

      {header && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-theme-text/70">Header</label>
            <button onClick={() => copyField('header', header)} className="flex items-center gap-1 text-xs text-theme-text/40 hover:text-theme-text/70">
              {copiedField === 'header' ? <FaCheck className="w-3 h-3 text-green-400" /> : <FaCopy className="w-3 h-3" />}
              {copiedField === 'header' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="bg-theme-background border border-theme-border/20 rounded-xl p-3 text-xs text-theme-text/80 font-mono whitespace-pre-wrap overflow-auto max-h-48">{header}</pre>
        </div>
      )}

      {payload && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-theme-text/70">Payload</label>
            <button onClick={() => copyField('payload', payload)} className="flex items-center gap-1 text-xs text-theme-text/40 hover:text-theme-text/70">
              {copiedField === 'payload' ? <FaCheck className="w-3 h-3 text-green-400" /> : <FaCopy className="w-3 h-3" />}
              {copiedField === 'payload' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="bg-theme-background border border-theme-border/20 rounded-xl p-3 text-xs text-theme-text/80 font-mono whitespace-pre-wrap overflow-auto max-h-96">{payload}</pre>
        </div>
      )}

      {signature && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-theme-text/70">Signature</label>
            <button onClick={() => copyField('signature', signature)} className="flex items-center gap-1 text-xs text-theme-text/40 hover:text-theme-text/70">
              {copiedField === 'signature' ? <FaCheck className="w-3 h-3 text-green-400" /> : <FaCopy className="w-3 h-3" />}
              {copiedField === 'signature' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="bg-theme-background border border-theme-border/20 rounded-xl p-3 text-xs text-theme-text/60 font-mono break-all">{signature}</div>
        </div>
      )}
    </div>
  );
}
