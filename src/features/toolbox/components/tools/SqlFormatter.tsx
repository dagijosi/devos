import { useState, useCallback } from 'react';
import { FaCopy, FaCheck } from 'react-icons/fa';

const KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
  'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX', 'VIEW',
  'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'CROSS', 'ON',
  'GROUP', 'BY', 'ORDER', 'ASC', 'DESC', 'HAVING',
  'LIMIT', 'OFFSET', 'UNION', 'ALL', 'DISTINCT',
  'AS', 'LIKE', 'BETWEEN', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
  'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CASCADE',
  'DEFAULT', 'CHECK', 'UNIQUE', 'CONSTRAINT',
  'IF', 'EXISTS', 'REPLACE', 'TRUNCATE', 'COMMIT', 'ROLLBACK',
]);

const MAJOR_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET',
  'DELETE', 'CREATE', 'ALTER', 'DROP', 'JOIN', 'LEFT', 'RIGHT', 'INNER',
  'OUTER', 'CROSS', 'ON', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'UNION',
]);

function formatSql(sql: string): string {
  const tokens = sql
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*\(\s*/g, ' (')
    .replace(/\s*\)\s*/g, ') ')
    .trim()
    .split(/\b/);

  const result: string[] = [];
  let indent = 0;
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i].trim();
    if (!token) { i++; continue; }

    const upper = token.toUpperCase();

    if (upper === ')') {
      indent = Math.max(0, indent - 1);
      result.push('\n' + '  '.repeat(indent) + token);
    } else if (MAJOR_KEYWORDS.has(upper) && upper !== 'ON' && upper !== 'AS') {
      result.push('\n' + '  '.repeat(indent) + token);
      if (upper === 'SELECT' || upper === 'CREATE') indent++;
    } else if (upper === 'ON') {
      result.push('\n' + '  '.repeat(indent + 1) + token);
    } else if (upper === 'AND' || upper === 'OR') {
      result.push('\n' + '  '.repeat(indent + 1) + token);
    } else if (upper === '(' && i > 0 && tokens[i - 1]?.trim()?.toUpperCase() === 'IN') {
      result.push(token);
    } else if (upper === '(') {
      result.push(token);
      indent++;
    } else {
      result.push(KEYWORDS.has(upper) ? upper : token);
    }
    i++;
  }

  return result.join('').trim();
}

export function SqlFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const format = useCallback(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(formatSql(input));
    } catch {
      setOutput('Error formatting SQL');
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
        <label className="text-sm font-medium text-theme-text/70 mb-1.5 block">SQL Query</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          placeholder="SELECT id, name FROM users WHERE active = 1 ORDER BY name"
          className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 font-mono resize-y"
        />
      </div>

      <button onClick={format} className="px-5 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors">
        Format
      </button>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-theme-text/70">Formatted SQL</label>
          {output && (
            <button onClick={copyOutput} className="flex items-center gap-1 text-xs text-theme-text/40 hover:text-theme-text/70">
              {copied ? <FaCheck className="w-3 h-3 text-green-400" /> : <FaCopy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
        <pre className="w-full bg-theme-background border border-theme-border/20 rounded-xl p-4 text-sm text-theme-text/80 font-mono whitespace-pre overflow-auto max-h-96 min-h-[60px]">
          {output || 'Formatted SQL will appear here'}
        </pre>
      </div>
    </div>
  );
}
