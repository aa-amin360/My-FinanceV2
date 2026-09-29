import type { ReactNode } from "react";

// Glass panel with a heading, used to group a form section
export default function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md rounded-3xl p-4 sm:p-6 shadow-sm shadow-black/[0.01] space-y-4">
      <h3 className="text-lg font-bold text-black dark:text-white leading-none">{title}</h3>
      {children}
    </div>
  );
}
