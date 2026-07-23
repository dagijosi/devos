import { useState } from 'react';

function md5(str: string): string {
  // Pure JS MD5 for browser use since crypto.subtle doesn't support MD5
  const rotateLeft = (x: number, n: number) => (x << n) | (x >>> (32 - n));
  const toHex = (n: number) => {
    let s = '';
    for (let i = 0; i < 4; i++) {
      s += '0123456789abcdef'[(n >> (i * 8 + 4)) & 0x0f] + '0123456789abcdef'[(n >> (i * 8)) & 0x0f];
    }
    return s;
  };
  const words: number[] = [];
  const msg = unescape(encodeURIComponent(str));
  for (let i = 0; i < msg.length * 8; i += 8) words[i >> 5] |= (msg.charCodeAt(i / 8) & 0xff) << (i % 32);
  words[msg.length * 8 >> 5] |= 0x80 << ((msg.length * 8) % 32);
  words[(((msg.length * 8 + 64) >>> 9) << 4) + 14] = msg.length * 8;
  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;
  const s = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
  const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000));
  for (let i = 0; i < words.length; i += 16) {
    const X = words.slice(i, i + 16);
    let [A, B, C, D] = [a, b, c, d];
    for (let j = 0; j < 64; j++) {
      let F, g;
      if (j < 16) { F = (B & C) | (~B & D); g = j; }
      else if (j < 32) { F = (D & B) | (~D & C); g = (5 * j + 1) % 16; }
      else if (j < 48) { F = B ^ C ^ D; g = (3 * j + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * j) % 16; }
      F = (A + F + K[j] + X[g]) | 0;
      A = D; D = C; C = B; B = (B + rotateLeft(F, s[j])) | 0;
    }
    a = (a + A) | 0; b = (b + B) | 0; c = (c + C) | 0; d = (d + D) | 0;
  }
  return toHex(a) + toHex(b) + toHex(c) + toHex(d);
}

export function Md5Tool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const hash = () => setOutput(md5(input));

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50 font-mono";

  return (
    <div className="space-y-4">
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={4} placeholder="Enter text to hash..." className={ic} />
      <button onClick={hash} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">Generate MD5</button>
      {output && (
        <div className="flex items-center gap-3 p-3 bg-theme-background rounded-lg">
          <code className="text-xs text-theme-text font-mono break-all flex-1">{output}</code>
          <button onClick={() => navigator.clipboard.writeText(output)} className="text-[10px] px-2 py-1 rounded bg-theme-surface border border-theme-border/20 text-theme-text/60 hover:text-theme-icon shrink-0">Copy</button>
        </div>
      )}
    </div>
  );
}
