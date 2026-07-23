import { useState } from 'react';

const PUBLIC_DNS = [
  { name: 'google.com', ips: ['8.8.8.8', '8.8.4.4'] },
  { name: 'cloudflare.com', ips: ['1.1.1.1', '1.0.0.1'] },
  { name: 'opendns.com', ips: ['208.67.222.222', '208.67.220.220'] },
];

export function DnsLookup() {
  const [domain, setDomain] = useState('');
  const [results, setResults] = useState<{ name: string; ips: string[] } | null>(null);
  const [error, setError] = useState('');

  const lookup = async () => {
    if (!domain.trim()) { setError('Enter a domain'); return; }
    const found = PUBLIC_DNS.find(d => d.name === domain.trim().toLowerCase());
    if (found) {
      setResults(found); setError('');
    } else {
      setResults(null);
      setError(`DNS lookup for "${domain}" — in a full implementation, this would query DNS servers. Known domains: google.com, cloudflare.com, opendns.com`);
    }
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50";

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="example.com" className={`${ic} flex-1`} />
        <button onClick={lookup} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">Lookup</button>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      {results && (
        <div className="bg-theme-background border border-theme-border/20 rounded-xl p-4 space-y-2">
          <p className="text-xs font-medium text-theme-text">{results.name}</p>
          <div className="space-y-1">{results.ips.map((ip, i) => <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-theme-surface rounded-lg text-xs"><code className="text-theme-text font-mono">{ip}</code><button onClick={() => navigator.clipboard.writeText(ip)} className="text-[10px] text-theme-icon hover:underline">Copy</button></div>)}</div>
        </div>
      )}
    </div>
  );
}
