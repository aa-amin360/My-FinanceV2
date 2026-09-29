import EmptyState from "@/frontend/components/atoms/EmptyState";
import PlanCard from "@/frontend/components/molecules/PlanCard";
import PlanRow from "@/frontend/components/molecules/PlanRow";
import { isOverdue } from "@/frontend/lib/plans";
import { localDateString } from "@/shared/config";
import type { BudgetPlan } from "@/shared/apiTypes";

type PlanListProps = {
  plans: BudgetPlan[];
  monthName: string;
  onProcess: (plan: BudgetPlan) => void;
  onDelete: (id: number) => void;
  // False until the first response arrives, so the empty message doesn't flash
  loaded?: boolean;
};

// Budget plans as a table on desktop and cards on mobile
export default function PlanList({ plans, monthName, onProcess, onDelete, loaded = true }: PlanListProps) {
  const today = localDateString();
  const empty = <EmptyState>No planned items scheduled for {monthName}.</EmptyState>;

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] rounded-3xl overflow-hidden shadow-sm shadow-black/[0.01]">
        <div className="grid grid-cols-12 px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b border-black/[0.05] dark:border-white/[0.04] leading-none">
          <div className="col-span-3">Target</div>
          <div className="col-span-2">Expected Date</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-3">Note</div>
          <div className="col-span-2 text-right">Amount</div>
        </div>

        <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04] stagger">
          {plans.map((p) => (
            <PlanRow key={p.id} plan={p} overdue={isOverdue(p, today)} onProcess={onProcess} onDelete={onDelete} />
          ))}
          {loaded && plans.length === 0 && empty}
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3 stagger">
        {plans.map((p) => (
          <PlanCard key={p.id} plan={p} overdue={isOverdue(p, today)} onProcess={onProcess} onDelete={onDelete} />
        ))}
        {loaded && plans.length === 0 && empty}
      </div>
    </>
  );
}
