import type { BudgetPlan } from "@/shared/apiTypes";

type PlanStatusActionProps = {
  plan: BudgetPlan;
  overdue: boolean;
  onProcess: (plan: BudgetPlan) => void;
  // "sm" is the compact mobile variant
  size?: "md" | "sm";
};

// "Due"/"Overdue" button for pending plans, or the final status label
export default function PlanStatusAction({ plan, overdue, onProcess, size = "md" }: PlanStatusActionProps) {
  const text = size === "sm" ? "text-[10px]" : "text-xs shrink-0";

  if (plan.status !== "PENDING") {
    const color = plan.status === "CONFIRMED" ? "text-emerald-500" : "text-zinc-500";
    return (
      <span className={`text-[10px] font-bold uppercase tracking-wider ${color}${size === "md" ? " shrink-0" : ""}`}>
        {plan.status}
      </span>
    );
  }

  const tone = overdue ? "bg-red-500 hover:bg-red-400 text-white" : "bg-green-500 text-black hover:bg-green-400";
  return (
    <button
      type="button"
      onClick={() => onProcess(plan)}
      className={`px-2.5 py-1 rounded-lg ${tone} ${text} font-bold transition active:scale-95 shadow-sm`}
    >
      {overdue ? "Overdue" : "Due"}
    </button>
  );
}
