import type { ReactNode } from "react";

type HeadingProps = {
  as?: "h1" | "h2" | "h3";
  children: ReactNode;
};

// Page and section title: bold 2xl, black/white by theme
export default function Heading({ as: Tag = "h1", children }: HeadingProps) {
  return <Tag className="text-2xl font-bold tracking-tight text-black dark:text-white">{children}</Tag>;
}
