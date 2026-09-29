import CashflowChart from "@/frontend/components/organisms/CashflowChart";
import { formatDbDate } from "@/frontend/lib/format";
import type { Report } from "@/shared/apiTypes";

// Cash + Bank balance over time, computed on the server over the full ledger
export default function BalanceTrajectoryCard({ trajectory }: { trajectory: Report["trajectory"] }) {
  const chartData = trajectory.map((point) => ({
    date: formatDbDate(point.date, "short"),
    balance: point.balance,
  }));

  return (
    <div className="lg:col-span-8 bg-white/45 dark:bg-black/30 border border-black/[0.05] dark:border-white/[0.05] backdrop-blur-md rounded-3xl p-5 shadow-sm">
      <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">Balance Trajectory</h3>
      <div className="h-[280px]">
        <CashflowChart data={chartData} />
      </div>
    </div>
  );
}
