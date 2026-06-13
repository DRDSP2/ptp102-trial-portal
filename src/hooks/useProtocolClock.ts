import { useSyncExternalStore } from 'react';

let currentNow = Date.now();
const listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function subscribe(callback: () => void) {
  listeners.add(callback);
  if (!intervalId) {
    intervalId = setInterval(() => {
      currentNow = Date.now();
      listeners.forEach((listener) => listener());
    }, 1000);
  }
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

/**
 * A shared 1-second wall-clock source for protocol countdown components.
 * Using a single interval avoids multiple setInterval timers running in parallel
 * and reduces the number of commits when both NextDoseTimer and TreatmentTimeline
 * are mounted.
 */
export function useProtocolClock(): number {
  return useSyncExternalStore(subscribe, () => currentNow, () => currentNow);
}
