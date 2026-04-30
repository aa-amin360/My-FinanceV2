"use client";

import { useEffect, useRef } from "react";

export function useRefresh(callback: () => void) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    callbackRef.current();

    const handler = () => {
      callbackRef.current();
    };

    window.addEventListener("refreshData", handler);

    return () => {
      window.removeEventListener("refreshData", handler);
    };
  }, []);
}
