import { useEffect } from 'react';
import { create } from 'zustand';

interface ActivitySignalState {
  lastActivityAt: number;
  creditUntil: number;
  capturing: boolean;
  capturingProject: string | null;
  markActivity: () => void;
  creditWork: (minutes: number) => void;
  setCapturing: (capturing: boolean, projectName: string | null) => void;
}

export const useActivitySignal = create<ActivitySignalState>((set, get) => ({
  lastActivityAt: Date.now(),
  creditUntil: 0,
  capturing: false,
  capturingProject: null,
  markActivity: () => set({ lastActivityAt: Date.now() }),
  creditWork: (minutes) => {
    const base = Math.max(get().creditUntil, Date.now());
    set({ creditUntil: base + minutes * 60000, lastActivityAt: Date.now() });
  },
  setCapturing: (capturing, projectName) => set({ capturing, capturingProject: projectName }),
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
