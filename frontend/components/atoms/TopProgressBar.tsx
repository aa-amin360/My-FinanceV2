"use client";

import { useEffect, useState } from "react";
import { onActivityChange } from "@/frontend/lib/activity";

// Requests shorter than this don't show the bar, which avoids flicker
const SHOW_DELAY_MS = 150;

// Thin animated bar across the top of the screen while data is loading
export default function TopProgressBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const unsubscribe = onActivityChange((pending) => {
      clearTimeout(timer);
      if (pending > 0) {
        timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      } else {
        setVisible(false);
      }
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`fixed top-0 left-0 right-0 h-0.5 z-[200] overflow-hidden pointer-events-none transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div className="h-full w-full origin-left bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-400 animate-progress" />
    </div>
  );
}
