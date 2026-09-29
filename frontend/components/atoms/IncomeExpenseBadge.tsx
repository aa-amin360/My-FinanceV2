type IncomeExpenseBadgeProps = {
  type: string;
  // "sm" is the compact mobile variant
  size?: "md" | "sm";
};

// INCOME (green) / EXPENSE (red) pill for plans and categories
export default function IncomeExpenseBadge({ type, size = "md" }: IncomeExpenseBadgeProps) {
  const style =
    type === "INCOME"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : "bg-rose-500/15 text-rose-600 dark:text-rose-400";
  const sizeClass = size === "sm" ? "px-2 text-[9px] shrink-0" : "px-2.5 text-[10px]";

  return <span className={`${sizeClass} py-0.5 rounded-full font-bold tracking-wide uppercase ${style}`}>{type}</span>;
}
