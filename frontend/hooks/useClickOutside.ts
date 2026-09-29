"use client";

import { RefObject, useEffect, useRef } from "react";

// Call `onOutside` when the user presses the mouse anywhere outside `ref`
export function useClickOutside<T extends HTMLElement>(ref: RefObject<T>, onOutside: () => void) {
  const handlerRef = useRef(onOutside);
  handlerRef.current = onOutside;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handlerRef.current();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ref]);
}
