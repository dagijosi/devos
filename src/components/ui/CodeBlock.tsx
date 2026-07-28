import { useMemo, useState } from 'react';
import hljs from 'highlight.js';
import { FaCopy, FaCheck } from 'react-icons/fa';

interface Props {
  code: string;
  language?: string;
  maxHeight?: string;
  showLineNumbers?: boolean;
  compact?: boolean;
}

export function CodeBlock({ code, language, maxHeight = 'none', showLineNumbers = true }: Props) {
  const [copied, setCopied] = useState(false);

  const highlighted = useMemo(() => {
    try {
      const lang = language && hljs.getLanguage(language) ? language : 'plaintext';
      return hljs.highlight(code, { language: lang }).value;
    } catch {
      return code;
    }
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const lines = highlighted.split('\n');
  const lineNumWidth = String(lines.length).length;

  return (
    <div className="group relative rounded-lg border border-theme-border/10 bg-theme-background/60 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-theme-background/80 border-b border-theme-border/5 text-[10px] text-theme-text/30">
        <span className="font-mono">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-theme-text/30 hover:text-theme-text hover:bg-theme-border/10 transition-colors"
          title="Copy code"
        >
          {copied ? <FaCheck className="w-2.5 h-2.5 text-green-400" /> : <FaCopy className="w-2.5 h-2.5" />}
          <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight }}>
        {showLineNumbers ? (
          <table className="w-full border-collapse text-[12px] leading-[1.6]">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="hover:bg-theme-icon/[0.03]">
                  <td
                    className="select-none text-right px-3 py-0 align-top text-theme-text/20 border-r border-theme-border/5 font-mono text-[11px]"
                    style={{ minWidth: `${Math.max(lineNumWidth + 3, 4)}ch` }}
                  >
                    {i + 1}
                  </td>
                  <td className="px-4 py-0 align-top">
                    <code
                      className="hljs"
                      style={{ background: 'transparent', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}
                      dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <pre className="p-3 m-0 text-[12px] leading-[1.6]">
            <code
              className="hljs"
              style={{ background: 'transparent', padding: 0 }}
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
        )}
      </div>
    </div>
  );
}
