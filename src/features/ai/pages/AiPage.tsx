import { useState } from 'react';
import { FaCog, FaBars } from 'react-icons/fa';
import { useChat } from '../hooks/useChat';
import { ChatView } from '../components/ChatView';
import { ConversationSidebar } from '../components/ConversationSidebar';
import { AiSettingsPanel } from '../components/AiSettingsPanel';
import { useAiStore } from '../store/ai.store';

export function AiPage() {
  const { messages, streaming, error, conversationId, sendMessage, loadConversation, newConversation, deleteConversation, renameConversation } = useChat();
  const { sidebarOpen, setSidebarOpen } = useAiStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex h-[calc(100dvh-4rem)] -m-3 sm:-m-4 lg:-m-6">
      {sidebarOpen && (
        <ConversationSidebar
          activeId={conversationId}
          onSelect={loadConversation}
          onNew={newConversation}
          onDelete={deleteConversation}
          onRename={renameConversation}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-theme-border/20 bg-theme-surface/30">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-theme-border/20 transition-colors"
              title="Toggle conversations"
            >
              <FaBars className="w-4 h-4 text-theme-text/50" />
            </button>
            <span className="text-sm font-medium text-theme-text/60">AI Assistant</span>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-1.5 rounded-lg hover:bg-theme-border/20 transition-colors"
            title="Settings"
          >
            <FaCog className="w-4 h-4 text-theme-text/50" />
          </button>
        </div>

        <ChatView messages={messages} streaming={streaming} error={error} onSend={sendMessage} />
      </div>

      <AiSettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
