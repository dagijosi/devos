import { useState, useCallback } from 'react';
import { FaCopy, FaCheck, FaArrowsAltH } from 'react-icons/fa';

export function TimestampConverter() {
  const [unixInput, setUnixInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [unixResult, setUnixResult] = useState('');
  const [dateResult, setDateResult] = useState('');
  const [copied, setCopied] = useState('');

  const unixToDate = useCallback(() => {
    const val = unixInput.trim();
    if (!val) { setDateResult(''); return; }
    const ms = val.length <= 10 ? parseInt(val) * 1000 : parseInt(val);
    if (isNaN(ms)) { setDateResult('Invalid timestamp'); return; }
    const d = new Date(ms);
    setDateResult(d.toLocaleString() + ' (UTC: ' + d.toUTCString() + ')');
  }, [unixInput]);

  const dateToUnix = useCallback(() => {
    const val = dateInput.trim();
    if (!val) { setUnixResult(''); return; }
    const d = new Date(val);
    if (isNaN(d.getTime())) { setUnixResult('Invalid date'); return; }
    setUnixResult(`Seconds: ${Math.floor(d.getTime() / 1000)}\nMilliseconds: ${d.getTime()}`);
  }, [dateInput]);

  const now = useCallback(() => {
    const d = new Date();
    setUnixInput(String(Math.floor(d.getTime() / 1000)));
    setDateInput(d.toISOString().slice(0, 16));
    setUnixResult('');
    setDateResult('');
  }, []);

  const copyResult = async (field: string, value: string) => {
    if (value) {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      setTimeout(() => setCopied(''), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={now} className="text-xs text-theme-icon hover:underline">Use current time</button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-theme-text/70 mb-1.5 block">Unix Timestamp → Date</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={unixInput}
                onChange={(e) => setUnixInput(e.target.value)}
                placeholder="1700000000"
                className="flex-1 bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 font-mono"
              />
              <button onClick={unixToDate} className="px-4 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors">
                Convert
              </button>
            </div>
          </div>
          {dateResult && (
            <div className="bg-theme-background border border-theme-border/20 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <pre className="text-sm text-theme-text/80 font-mono whitespace-pre-wrap">{dateResult}</pre>
                <button onClick={() => copyResult('date', dateResult)} className="p-1 text-theme-text/30 hover:text-theme-text/60 flex-shrink-0">
                  {copied === 'date' ? <FaCheck className="w-3 h-3 text-green-400" /> : <FaCopy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-theme-text/70 mb-1.5 block">Date → Unix Timestamp</label>
            <div className="flex gap-2">
              <input
                type="datetime-local"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="flex-1 bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text outline-none focus:border-theme-icon/50"
              />
              <button onClick={dateToUnix} className="px-4 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors">
                Convert
              </button>
            </div>
          </div>
          {unixResult && (
            <div className="bg-theme-background border border-theme-border/20 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <pre className="text-sm text-theme-text/80 font-mono whitespace-pre-wrap">{unixResult}</pre>
                <button onClick={() => copyResult('unix', unixResult)} className="p-1 text-theme-text/30 hover:text-theme-text/60 flex-shrink-0">
                  {copied === 'unix' ? <FaCheck className="w-3 h-3 text-green-400" /> : <FaCopy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
