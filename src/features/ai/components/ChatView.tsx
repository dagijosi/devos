import { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaSpinner, FaRobot, FaUser } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import type { DisplayMessage } from '../hooks/useChat';

interface ChatViewProps {
  messages: DisplayMessage[];
  streaming: boolean;
  error: string;
  onSend: (text: string) => Promise<void>;
}

export function ChatView({ messages, streaming, error, onSend }: ChatViewProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    onSend(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FaRobot className="w-12 h-12 text-theme-icon/30 mb-4" />
            <h2 className="text-lg font-semibold text-theme-text/60">AI Assistant</h2>
            <p className="text-sm text-theme-text/40 mt-1 max-w-md">
              Ask questions about your projects, notes, code snippets, or bugs. I can search your knowledge base and help you work more efficiently.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-6 max-w-sm">
              {[
                'What am I working on?',
                'Show my recent notes',
                'Find code snippets about React',
                'Summarize my projects',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onSend(suggestion)}
                  className="text-xs text-left px-3 py-2 bg-theme-surface border border-theme-border/20 rounded-xl text-theme-text/50 hover:text-theme-text/70 hover:border-theme-border/40 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role !== 'user' && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FaRobot className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-1' : ''}`}>
              <div className={`rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-theme-icon text-white rounded-tr-md'
                  : 'bg-theme-surface border border-theme-border/20 rounded-tl-md'
              }`}>
                <div className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-white/90' : 'text-theme-text/85'} prose-theme`}>
                  {msg.content ? (
                    msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <MarkdownContent content={msg.content} />
                    )
                  ) : (
                    <span className="flex items-center gap-1.5 text-theme-text/40">
                      <FaSpinner className="w-3 h-3 animate-spin" /> Thinking...
                    </span>
                  )}
                </div>
              </div>
              <div className={`text-[10px] text-theme-text/30 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-theme-icon/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FaUser className="w-3.5 h-3.5 text-theme-icon" />
              </div>
            )}
          </div>
        ))}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-theme-border/20 p-4">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your projects, code, or notes..."
            rows={1}
            className="flex-1 bg-theme-surface border border-theme-border/30 rounded-xl px-4 py-3 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50 resize-none max-h-32"
            disabled={streaming}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className="flex items-center justify-center w-11 h-11 bg-theme-icon text-white rounded-xl hover:bg-theme-icon/90 transition-colors disabled:opacity-40 flex-shrink-0 self-end"
          >
            {streaming ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaPaperPlane className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-theme-text/30 mt-2">Enter to send &middot; Shift+Enter for new line</p>
      </div>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        code: ({ className, children, ...props }) => {
          const isInline = !className;
          if (isInline) {
            return <code className="bg-theme-background/50 px-1 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>;
          }
          return (
            <pre className="bg-theme-background/50 rounded-lg p-3 overflow-x-auto my-2">
              <code className={`text-xs font-mono ${className || ''}`} {...props}>{children}</code>
            </pre>
          );
        },
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-theme-icon hover:underline">{children}</a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
