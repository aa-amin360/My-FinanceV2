"use client";

import { useEffect, useRef, useState } from "react";

// Smoothly animates a number from what is currently shown to `target`.
// Used so balances glide to their new value instead of jumping.
export function useCountUp(target: number, durationMs = 700) {
  const [value, setValue] = useState(target);
  // The number currently on screen, so a new target continues from there
  const shownRef = useRef(target);

  useEffect(() => {
    const from = shownRef.current;
    if (from === target) return;

    const show = (next: number) => {
      shownRef.current = next;
      setValue(next);
    };

    // Skip the animation for users who prefer reduced motion
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      show(target);
      return;
    }

    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      // Round to cents while animating; land exactly on the target at the end
      show(progress < 1 ? Math.round((from + (target - from) * eased) * 100) / 100 : target);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}
