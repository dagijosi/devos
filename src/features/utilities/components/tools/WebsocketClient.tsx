import { useState, useRef, useEffect } from 'react';

export function WebsocketClient() {
  const [url, setUrl] = useState('wss://echo.websocket.org');
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    return () => { wsRef.current?.close(); };
  }, []);

  const connect = () => {
    if (wsRef.current) { wsRef.current.close(); }
    try {
      const ws = new WebSocket(url);
      ws.onopen = () => { setConnected(true); setMessages(prev => [...prev, '🟢 Connected']); };
      ws.onmessage = (e) => { setMessages(prev => [...prev, `📩 ${e.data}`]); };
      ws.onclose = () => { setConnected(false); setMessages(prev => [...prev, '🔴 Disconnected']); };
      ws.onerror = () => { setMessages(prev => [...prev, '⚠️ Error']); };
      wsRef.current = ws;
    } catch (e: any) { setMessages(prev => [...prev, `❌ ${e.message}`]); }
  };

  const disconnect = () => { wsRef.current?.close(); };
  const send = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(input);
      setMessages(prev => [...prev, `📤 ${input}`]);
      setInput('');
    }
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50 font-mono";

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="wss://..." className={`${ic} flex-1`} />
        {!connected ? <button onClick={connect} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors">Connect</button>
          : <button onClick={disconnect} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">Disconnect</button>}
      </div>
      <div className="bg-theme-background border border-theme-border/20 rounded-lg p-3 h-48 overflow-y-auto font-mono text-[11px] text-theme-text space-y-1">
        {messages.length === 0 && <p className="text-theme-text/30">No messages</p>}
        {messages.map((m, i) => <div key={i}>{m}</div>)}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} disabled={!connected} placeholder="Type a message..." className={`${ic} flex-1`} />
        <button onClick={send} disabled={!connected} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 disabled:opacity-50 transition-colors">Send</button>
      </div>
    </div>
  );
}
