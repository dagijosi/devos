import { useEffect } from 'react';
import { create } from 'zustand';

interface ActivitySignalState {
  lastActivityAt: number;
  creditUntil: number;
  markActivity: () => void;
  creditWork: (minutes: number) => void;
}

export const useActivitySignal = create<ActivitySignalState>((set, get) => ({
  lastActivityAt: Date.now(),
  creditUntil: 0,
  markActivity: () => set({ lastActivityAt: Date.now() }),
  creditWork: (minutes) => {
    const base = Math.max(get().creditUntil, Date.now());
    set({ creditUntil: base + minutes * 60000, lastActivityAt: Date.now() });
  },
}));

export function markActivity(): void {
  useActivitySignal.getState().markActivity();
}

export function creditWork(minutes: number): void {
  useActivitySignal.getState().creditWork(minutes);
}

/**
 * Marks activity on a rolling interval while the caller (e.g. a terminal
 * page) is mounted and the window is visible, so the focus tracker counts
 * the time as work.
 */
export function useActivityBeacon(intervalSeconds = 30): void {
  useEffect(() => {
    markActivity();
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') markActivity();
    }, intervalSeconds * 1000);
    return () => clearInterval(t);
  }, [intervalSeconds]);
}
