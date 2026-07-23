import { useEffect, useRef, type ReactNode } from 'react';

interface FocusTrapProps {
  children: ReactNode;
  active: boolean;
}

export function FocusTrap({ children, active }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const getFocusableElements = () =>
      Array.from(container.querySelectorAll<HTMLElement>(focusableSelector));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const savedFocus = document.activeElement as HTMLElement | null;
    const focusable = getFocusableElements();
    if (focusable.length > 0) focusable[0].focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      savedFocus?.focus();
    };
  }, [active]);

  return <div ref={containerRef}>{children}</div>;
}
