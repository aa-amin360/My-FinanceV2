"use client";

import { useEffect, useRef } from "react";

// Run `callback` whenever any part of the app dispatches the global
// "refreshData" event (e.g. after a transaction is saved).
// By default it also runs once on mount; pass { runOnMount: false } when the
// component already loads its data from its own effect.
export function useRefresh(callback: () => void, { runOnMount = true }: { runOnMount?: boolean } = {}) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (runOnMount) callbackRef.current();

    const handler = () => {
      callbackRef.current();
    };

    window.addEventListener("refreshData", handler);
    return () => {
      window.removeEventListener("refreshData", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
