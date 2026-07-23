import { useState, useCallback, useMemo } from 'react';
import { FaCopy, FaCheck, FaSync } from 'react-icons/fa';

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

function getStrength(length: number, chars: string): { label: string; color: string; score: number } {
  const variety = [LOWERCASE, UPPERCASE, DIGITS, SYMBOLS].filter(s => [...s].some(c => chars.includes(c))).length;
  const score = Math.min(length * variety * 2, 100);
  if (score < 30) return { label: 'Weak', color: 'bg-red-500', score };
  if (score < 60) return { label: 'Fair', color: 'bg-yellow-500', score };
  if (score < 80) return { label: 'Good', color: 'bg-lime-500', score };
  return { label: 'Strong', color: 'bg-green-500', score };
}

export function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useDigits, setUseDigits] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const charset = useMemo(() => {
    let chars = '';
    if (useLower) chars += LOWERCASE;
    if (useUpper) chars += UPPERCASE;
    if (useDigits) chars += DIGITS;
    if (useSymbols) chars += SYMBOLS;
    return chars;
  }, [useLower, useUpper, useDigits, useSymbols]);

  const strength = useMemo(() => getStrength(length, charset), [length, charset]);

  const generate = useCallback(() => {
    if (!charset) { setPassword('Select at least one character type'); return; }
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    const pwd = Array.from(array).map(n => charset[n % charset.length]).join('');
    setPassword(pwd);
  }, [length, charset]);

  const copyPassword = async () => {
    if (password) {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-theme-background border border-theme-border/20 rounded-xl px-4 py-3 font-mono text-sm text-theme-text/90 break-all min-h-[44px] flex items-center">
          {password || 'Generated password will appear here'}
        </div>
        <button onClick={generate} className="p-2.5 rounded-xl bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors" title="Generate">
          <FaSync className="w-4 h-4" />
        </button>
        {password && (
          <button onClick={copyPassword} className="p-2.5 rounded-xl bg-theme-surface border border-theme-border/30 text-theme-text hover:bg-theme-surface/80 transition-colors" title="Copy">
            {copied ? <FaCheck className="w-4 h-4 text-green-400" /> : <FaCopy className="w-4 h-4" />}
          </button>
        )}
      </div>

      {password && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-theme-background rounded-full overflow-hidden">
              <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: `${strength.score}%` }} />
            </div>
            <span className="text-xs text-theme-text/50 w-16 text-right">{strength.label}</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="text-sm text-theme-text/70 mb-1 block">Length: {length}</label>
          <input
            type="range"
            min={4}
            max={64}
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value))}
            className="w-full accent-theme-icon"
          />
          <div className="flex justify-between text-[10px] text-theme-text/30 mt-0.5">
            <span>4</span><span>64</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Uppercase (A-Z)', key: 'useUpper', checked: useUpper },
            { label: 'Lowercase (a-z)', key: 'useLower', checked: useLower },
            { label: 'Digits (0-9)', key: 'useDigits', checked: useDigits },
            { label: 'Symbols (!@#)', key: 'useSymbols', checked: useSymbols },
          ].map(({ label, key, checked }) => (
            <label key={key} className="flex items-center gap-2 text-sm text-theme-text/60 cursor-pointer p-2 rounded-lg hover:bg-theme-background/50 transition-colors">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  switch (key) {
                    case 'useUpper': setUseUpper(!useUpper); break;
                    case 'useLower': setUseLower(!useLower); break;
                    case 'useDigits': setUseDigits(!useDigits); break;
                    case 'useSymbols': setUseSymbols(!useSymbols); break;
                  }
                }}
                className="rounded border-theme-border/30 text-theme-icon focus:ring-theme-icon/30"
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
