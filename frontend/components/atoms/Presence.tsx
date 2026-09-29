"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

type PresenceProps = {
  show: boolean;
  children: ReactNode;
  // Should match the exit animations in app/globals.css
  exitMs?: number;
};

// Keeps content mounted briefly after `show` turns false so it can animate out.
// While closing, the last rendered content gets the .presence-exit class, which
// switches modalIn/popIn elements to their exit animations (see globals.css).
// The wrapper is always the same display: contents element, so layout is
// unaffected and the content keeps its state while it animates out.
export default function Presence({ show, children, exitMs = 180 }: PresenceProps) {
  const [closing, setClosing] = useState(false);
  const lastChildren = useRef<ReactNode>(null);
  const wasShown = useRef(show);

  if (show) lastChildren.current = children;
  // True on the very render where `show` flips off, before the effect runs
  const justHidden = !show && wasShown.current;

  useEffect(() => {
    if (show) {
      wasShown.current = true;
      setClosing(false);
      return;
    }
    if (!wasShown.current) return; // never animate out on first render
    wasShown.current = false;
    setClosing(true);
    const timer = setTimeout(() => setClosing(false), exitMs);
    return () => clearTimeout(timer);
  }, [show, exitMs]);

  const exiting = !show && (closing || justHidden);
  if (!show && !exiting) return null;

  return <div className={exiting ? "presence-exit contents" : "contents"}>{show ? children : lastChildren.current}</div>;
}
