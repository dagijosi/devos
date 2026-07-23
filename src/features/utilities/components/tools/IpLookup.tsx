import { useState } from 'react';

export function IpLookup() {
  const [ip, setIp] = useState('8.8.8.8');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const lookup = async () => {
    if (!ip.trim()) return;
    setError(''); setResult(null);
    try {
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,isp,org,as,query`);
      const data = await res.json();
      if (data.status === 'fail') { setError(data.message || 'Lookup failed'); return; }
      setResult(data);
    } catch {
      setError('Failed to reach IP lookup service. Try again later.');
    }
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50";

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={ip} onChange={e => setIp(e.target.value)} placeholder="8.8.8.8" className={`${ic} flex-1`} />
        <button onClick={lookup} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">Lookup</button>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      {result && (
        <div className="bg-theme-background border border-theme-border/20 rounded-xl p-4 space-y-2">
          {[
            ['IP', result.query], ['Country', result.country], ['Region', result.regionName],
            ['City', result.city], ['ISP', result.isp], ['Organization', result.org], ['AS', result.as],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between items-center px-3 py-1.5 bg-theme-surface rounded-lg text-xs">
              <span className="text-theme-text/60">{label}</span>
              <span className="text-theme-text font-mono text-right">{value || '-'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
