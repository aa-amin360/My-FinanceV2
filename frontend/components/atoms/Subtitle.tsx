import type { ReactNode } from "react";

// Muted one-line description under a page title
export default function Subtitle({ children }: { children: ReactNode }) {
  return <p className="text-sm text-slate-500 dark:text-zinc-500">{children}</p>;
}
