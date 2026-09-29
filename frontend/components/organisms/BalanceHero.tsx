import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CURRENCY, formatMoney, formatNumber } from "@/shared/config";

type BalanceHeroProps = {
  balance: number;
  cashBalance: number;
  bankBalance: number;
};

// Large spendable-balance card at the top of the dashboard
export default function BalanceHero({ balance, cashBalance, bankBalance }: BalanceHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 border shadow-xl transition-all duration-300 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-600/10 border-emerald-500/20 shadow-emerald-500/[0.03] dark:from-emerald-950/20 dark:via-emerald-950/15 dark:to-zinc-950/40 dark:border-emerald-500/15 dark:backdrop-blur-md">
      <div className="absolute top-[-30%] right-[-10%] w-60 h-60 rounded-full bg-emerald-500/15 dark:bg-emerald-500/10 blur-[70px] pointer-events-none" />

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest leading-none text-emerald-700/85 dark:text-emerald-400/80">
            Ledger Available Balance
          </span>

          <h1 className="text-3xl font-extrabold tracking-tight pt-0.5 text-emerald-800 dark:text-white">
            {formatNumber(balance)} <span className="text-emerald-600 dark:text-emerald-400 text-xl font-bold">{CURRENCY}</span>
          </h1>

          <div className="flex gap-4 pt-1.5 text-xs font-semibold font-mono text-emerald-700/80 dark:text-emerald-400/70 leading-none">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600/60 dark:bg-emerald-500/40" /> Cash: {formatMoney(cashBalance)}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600/60 dark:bg-emerald-500/40" /> Bank: {formatMoney(bankBalance)}
            </span>
          </div>
        </div>

        <Link
          href="/add-history"
          className="self-start sm:self-center px-4 py-2 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 hover:scale-[1.03] border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:border-emerald-500/15 dark:bg-emerald-500/5 dark:text-green-300 dark:hover:bg-emerald-500/10"
        >
          Add History <ArrowUpRight size={13} className="text-emerald-600 dark:text-emerald-400" />
        </Link>
      </div>
    </div>
  );
}
