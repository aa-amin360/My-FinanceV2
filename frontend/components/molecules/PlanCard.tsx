import { Trash2 } from "lucide-react";
import OverdueDot from "@/frontend/components/atoms/OverdueDot";
import IncomeExpenseBadge from "@/frontend/components/atoms/IncomeExpenseBadge";
import PlanStatusAction from "@/frontend/components/molecules/PlanStatusAction";
import { formatDbDate } from "@/frontend/lib/format";
import { formatMoney } from "@/shared/config";
import type { BudgetPlan } from "@/shared/apiTypes";

type PlanCardProps = {
  plan: BudgetPlan;
  overdue: boolean;
  onProcess: (plan: BudgetPlan) => void;
  onDelete: (id: number) => void;
};

// Mobile card for a budget plan
export default function PlanCard({ plan: p, overdue, onProcess, onDelete }: PlanCardProps) {
  return (
    <div className="bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md p-4 rounded-2xl shadow-sm shadow-black/[0.01] flex flex-col gap-3">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm text-black dark:text-white truncate">{p.target_name}</p>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1.5">
            <span>{formatDbDate(p.date, "short")}</span>
            {overdue && <OverdueDot />}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-sm text-black dark:text-white">{formatMoney(p.amount)}</p>
        </div>
      </div>

      <div className="flex justify-between items-center gap-3 pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
        <div className="flex items-center gap-2 min-w-0">
          <IncomeExpenseBadge type={p.type} size="sm" />
          {p.note && <span className="text-[11px] text-slate-400 dark:text-zinc-500 truncate max-w-[140px]">{p.note}</span>}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <PlanStatusAction plan={p} overdue={overdue} onProcess={onProcess} size="sm" />

          <button type="button" onClick={() => onDelete(p.id)} className="p-1 rounded-lg text-red-400 hover:bg-red-500/10 transition">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
