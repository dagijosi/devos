import { useState, useCallback, useRef } from 'react';
import { streamChat } from '../services/provider';
import { buildContext, SYSTEM_PROMPT } from '../services/knowledge';
import { useAiStore } from '../store/ai.store';
import { database } from '../../../database';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export function useChat() {
  const config = useAiStore((s) => s.config);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const [conversationId, setConversationId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const addMessage = useCallback((msg: DisplayMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const updateLastAssistant = useCallback((content: string) => {
    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last?.role === 'assistant') {
        copy[copy.length - 1] = { ...last, content };
      }
      return copy;
    });
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;
    setError('');

    let cid = conversationId;
    if (!cid) {
      const conv = await database.createAiConversation({
        title: text.slice(0, 50),
        provider: config.provider,
        model: config.model,
      });
      if (conv) {
        cid = conv.id;
        setConversationId(cid);
      }
    }

    const userMsg: DisplayMessage = { id: `msg_${Date.now()}`, role: 'user', content: text, timestamp: new Date() };
    addMessage(userMsg);

    if (cid) {
      await database.createAiMessage({ conversation_id: cid, role: 'user', content: text });
    }

    setStreaming(true);
    setMessages((prev) => [...prev, { id: `msg_assistant_${Date.now()}`, role: 'assistant', content: '', timestamp: new Date() }]);

    try {
      const context = await buildContext(text);

      const systemContent = context ? `${SYSTEM_PROMPT}\n\nCurrent context:\n${context}` : SYSTEM_PROMPT;

      const chatMessages = [
        { role: 'system' as const, content: systemContent },
        ...messages.filter(m => m.role !== 'system').map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: text },
      ];

      let fullResponse = '';

      for await (const chunk of streamChat(config, chatMessages)) {
        fullResponse += chunk;
        updateLastAssistant(fullResponse);
      }

      if (cid && fullResponse) {
        await database.createAiMessage({ conversation_id: cid, role: 'assistant', content: fullResponse });
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Request failed';
      setError(errorMsg);
      updateLastAssistant(`Error: ${errorMsg}`);
    } finally {
      setStreaming(false);
    }
  }, [conversationId, config, messages, streaming, addMessage, updateLastAssistant]);

  const loadConversation = useCallback(async (id: number) => {
    setConversationId(id);
    setError('');
    const dbMessages = await database.getAiMessages(id);
    setMessages(
      dbMessages.map((m: any) => ({
        id: `msg_${m.id}`,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at),
      }))
    );
  }, []);

  const newConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setError('');
  }, []);

  const deleteConversation = useCallback(async (id: number) => {
    await database.deleteAiConversation(id);
    if (conversationId === id) newConversation();
  }, [conversationId, newConversation]);

  const renameConversation = useCallback(async (id: number, title: string) => {
    await database.updateAiConversation(id, { title });
  }, []);

  return {
    messages,
    streaming,
    error,
    conversationId,
    sendMessage,
    loadConversation,
    newConversation,
    deleteConversation,
    renameConversation,
  };
}
