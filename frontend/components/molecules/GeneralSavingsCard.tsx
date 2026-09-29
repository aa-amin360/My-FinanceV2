import { CURRENCY, formatNumber } from "@/shared/config";

// Savings not assigned to any goal
export default function GeneralSavingsCard({ amount }: { amount: number }) {
  return (
    <div className="bg-emerald-500/5 border border-emerald-500/20 backdrop-blur-md p-6 rounded-[28px] flex flex-col justify-between h-[250px]">
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold text-black dark:text-white">General Savings</h3>
          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-lg">Unallocated</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
          Money stored inside your savings accounts that has not been explicitly assigned to any virtual target goal yet.
        </p>
      </div>
      <div className="pt-4 border-t border-black/[0.04] dark:border-white/[0.04]">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Available Reserve</span>
        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
          {formatNumber(amount)} <span className="text-xs font-bold text-slate-500">{CURRENCY}</span>
        </div>
      </div>
    </div>
  );
}
