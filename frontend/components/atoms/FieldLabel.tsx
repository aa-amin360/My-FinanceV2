import type { ReactNode } from "react";

type FieldLabelProps = {
  as?: "label" | "span";
  // Indent slightly to line up with rounded inputs
  inset?: boolean;
  children: ReactNode;
};

// Tiny uppercase label shown above form fields
export default function FieldLabel({ as: Tag = "label", inset = false, children }: FieldLabelProps) {
  const className = inset
    ? "text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1"
    : "text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest";
  return <Tag className={className}>{children}</Tag>;
}
