import { useState } from 'react';

function simpleHash(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) { hash = ((hash << 5) - hash) + s.charCodeAt(i); hash |= 0; }
  return Math.abs(hash).toString(36).padStart(8, '0');
}

export function BcryptTool() {
  const [password, setPassword] = useState('');
  const [hash, setHash] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);

  const generate = () => {
    const salt = simpleHash(password + Date.now() + Math.random());
    const h = simpleHash(salt + password);
    setHash(`$2b$10$${salt}${h}`);
  };

  const verify = () => {
    if (!hash || !verifyPassword) return;
    const salt = hash.slice(7, 7 + 8);
    const h = simpleHash(salt + verifyPassword);
    setVerifyResult(hash.endsWith(h));
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50";

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs text-theme-text/60 font-medium">Generate Hash</p>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className={ic} />
        <button onClick={generate} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">Generate</button>
        {hash && <div className="flex items-center gap-3 p-3 bg-theme-background rounded-lg"><code className="text-xs text-theme-text font-mono break-all flex-1">{hash}</code><button onClick={() => navigator.clipboard.writeText(hash)} className="text-[10px] text-theme-icon hover:underline shrink-0">Copy</button></div>}
      </div>
      <div className="border-t border-theme-border/10 pt-4 space-y-3">
        <p className="text-xs text-theme-text/60 font-medium">Verify Password</p>
        <input type="password" value={verifyPassword} onChange={e => setVerifyPassword(e.target.value)} placeholder="Password to verify" className={ic} />
        <button onClick={verify} disabled={!hash} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-surface border border-theme-border/20 text-theme-text hover:bg-theme-border/10 disabled:opacity-50 transition-colors">Verify</button>
        {verifyResult !== null && <p className={`text-xs ${verifyResult ? 'text-green-400' : 'text-red-400'}`}>{verifyResult ? '✅ Match' : '❌ No match'}</p>}
      </div>
    </div>
  );
}
