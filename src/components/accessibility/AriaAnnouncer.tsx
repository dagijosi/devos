import { useEffect, useState } from 'react';

let announceFn: ((message: string, priority?: 'polite' | 'assertive') => void) | null = null;

export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  announceFn?.(message, priority);
}

export function AriaAnnouncer() {
  const [polite, setPolite] = useState('');
  const [assertive, setAssertive] = useState('');

  useEffect(() => {
    announceFn = (message, priority) => {
      if (priority === 'assertive') setAssertive(message);
      else setPolite(message);
    };
    return () => { announceFn = null; };
  }, []);

  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {polite}
    </div>
  );
}

export function AriaAlert({ message }: { message: string }) {
  return (
    <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
      {message}
    </div>
  );
}
