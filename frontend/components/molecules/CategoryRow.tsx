import IncomeExpenseBadge from "@/frontend/components/atoms/IncomeExpenseBadge";
import { formatMoney } from "@/shared/config";
import type { Category } from "@/shared/apiTypes";

// Category name, type and all-time total
export default function CategoryRow({ category }: { category: Category }) {
  const totalColor = category.type === "INCOME" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";

  return (
    <div className="grid grid-cols-3 items-center px-5 py-4 border-b border-black/[0.03] dark:border-white/[0.03] hover:bg-white/35 dark:hover:bg-black/35 transition-all duration-200 text-sm">
      <div className="font-semibold text-black dark:text-white">{category.name}</div>
      <div>
        <IncomeExpenseBadge type={category.type} />
      </div>
      <div className={`text-right font-bold ${totalColor}`}>{formatMoney(Number(category.total || 0))}</div>
    </div>
  );
}
