// Counts in-flight API requests so the UI can show a loading indicator.
// frontend/api/client.ts reports every request here.

type Listener = (pending: number) => void;

let pending = 0;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener(pending));
}

export function requestStarted() {
  pending += 1;
  emit();
}

export function requestFinished() {
  pending = Math.max(0, pending - 1);
  emit();
}

// Subscribe to changes; returns an unsubscribe function
export function onActivityChange(listener: Listener) {
  listeners.add(listener);
  listener(pending);
  return () => {
    listeners.delete(listener);
  };
}
