import { useEffect, useRef } from 'react';
import { useClipboardStore } from './clipboard.store';

export function ClipboardWatcher() {
  const addEntry = useClipboardStore((s) => s.addEntry);
  const lastContent = useRef('');
  const pollTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    const poll = async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && text !== lastContent.current) {
          lastContent.current = text;
          addEntry(text, 'text', 'clipboard');
        }
      } catch {
        // Clipboard access denied or unavailable
      }
    };

    poll();
    pollTimer.current = setInterval(poll, 2000);

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [addEntry]);

  return null;
}
