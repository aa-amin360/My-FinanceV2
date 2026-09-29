import { Trash2 } from "lucide-react";
import OverdueDot from "@/frontend/components/atoms/OverdueDot";
import IncomeExpenseBadge from "@/frontend/components/atoms/IncomeExpenseBadge";
import PlanStatusAction from "@/frontend/components/molecules/PlanStatusAction";
import { formatDbDate } from "@/frontend/lib/format";
import { formatMoney } from "@/shared/config";
import type { BudgetPlan } from "@/shared/apiTypes";

type PlanRowProps = {
  plan: BudgetPlan;
  overdue: boolean;
  onProcess: (plan: BudgetPlan) => void;
  onDelete: (id: number) => void;
};

// Desktop table row for a budget plan
export default function PlanRow({ plan: p, overdue, onProcess, onDelete }: PlanRowProps) {
  return (
    <div className="grid grid-cols-12 items-center px-5 py-4 hover:bg-white/35 dark:hover:bg-black/35 transition text-sm border-b border-black/[0.03] dark:border-white/[0.03]">
      <div className="col-span-3 font-semibold text-black dark:text-white truncate">{p.target_name}</div>

      <div className="col-span-2 text-xs text-slate-500 dark:text-zinc-500 flex items-center gap-1.5">
        <span>{formatDbDate(p.date, "short")}</span>
        {overdue && <OverdueDot title="Overdue!" />}
      </div>

      <div className="col-span-2">
        <IncomeExpenseBadge type={p.type} />
      </div>

      <div className="col-span-3 text-xs text-slate-400 dark:text-zinc-500 truncate pr-4">{p.note || "—"}</div>

      <div className="col-span-2 flex items-center justify-end gap-3 text-right">
        <span className="font-bold text-black dark:text-white shrink-0">{formatMoney(p.amount)}</span>

        <PlanStatusAction plan={p} overdue={overdue} onProcess={onProcess} />

        <button
          type="button"
          onClick={() => onDelete(p.id)}
          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition shrink-0 ml-1"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
