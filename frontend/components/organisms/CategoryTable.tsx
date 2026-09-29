import EmptyState from "@/frontend/components/atoms/EmptyState";
import CategoryRow from "@/frontend/components/molecules/CategoryRow";
import type { Category } from "@/shared/apiTypes";

// All categories with their totals
export default function CategoryTable({ categories }: { categories: Category[] }) {
  return (
    <div className="bg-white/45 dark:bg-black/30 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md rounded-3xl overflow-hidden shadow-sm shadow-black/[0.01]">
      <div className="grid grid-cols-3 px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b border-black/[0.05] dark:border-white/[0.04] leading-none">
        <div>Category</div>
        <div>Type</div>
        <div className="text-right">Total</div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-zinc-900/60">
        {categories.map((category) => (
          <CategoryRow key={category.id} category={category} />
        ))}
      </div>

      {categories.length === 0 && <EmptyState>No categories configured yet.</EmptyState>}
    </div>
  );
}
