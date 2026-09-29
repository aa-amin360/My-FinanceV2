import type { ReactNode } from "react";

// Next.js re-mounts a template on every navigation, which replays this
// entrance animation for the new page while the layout above stays put.
export default function PageTransition({ children }: { children: ReactNode }) {
  return <div className="animate-pageIn">{children}</div>;
}
