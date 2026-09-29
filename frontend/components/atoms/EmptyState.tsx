import type { ReactNode } from "react";

// Centered muted message for empty lists
export default function EmptyState({ children }: { children: ReactNode }) {
  return <div className="p-12 text-center text-slate-400 dark:text-zinc-500 text-sm">{children}</div>;
}
