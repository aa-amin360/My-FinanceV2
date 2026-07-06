"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useRefresh } from "@/hooks/useRefresh";

type Debt = {
  entity_id: string;
  name: string;
  total_amount: string;
  remaining_amount: string;
};

export default function DebtPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const router = useRouter();

  // =========================
  // LOAD DATA
  // =========================
  const loadData = () => {
    fetch("/api/debts/details", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setDebts(data.data || []));
  };

  useRefresh(loadData);

  const formatName = (text: string) => {
    return text
      .toLowerCase()
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // =========================
  // REPAY FUNCTION
  // =========================
  const handleRepay = (entityName: string) => {
    window.dispatchEvent(
      new CustomEvent("openAdd", {
        detail: {
          type: "DEBT_REPAID",
          entity: entityName,
        },
      })
    );
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 animate-fadeIn pb-16">
        
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">Debts</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-500">Track and manage outstanding loans you owe to others.</p>
        </div>

        {/* LIST */}
        <div className="flex flex-col gap-4">
          {debts.map((d) => (
            // ✅ Updated card to standard translucent glassmorphic panel
            <div
              key={d.entity_id}
              onClick={() => router.push(`/debts/${d.entity_id}`)}
              className="
                bg-white/45 dark:bg-black/35
                border border-black/[0.05] dark:border-white/[0.04]
                backdrop-blur-md p-5 rounded-3xl
                shadow-sm shadow-black/[0.01]
                flex justify-between items-center
                hover:bg-white/60 dark:hover:bg-black/45
                hover:scale-[1.01] transition-all duration-200
                cursor-pointer
              "
            >
              {/* LEFT */}
              <div>
                <div className="font-bold text-lg text-black dark:text-white">
                  {formatName(d.name)}
                </div>
                <div className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                  Tap to view details
                </div>
              </div>

              {/* RIGHT */}
              <div className="text-right flex items-center gap-4">
                {/* ✅ Updated text color to premium Rose Crimson instead of neon red */}
                <div className="text-rose-600 dark:text-rose-400 font-extrabold text-lg sm:text-xl">
                  {Number(d.remaining_amount).toLocaleString("en-BD")} Tk
                </div>

                {/* REPAY BUTTON */}
                {/* ✅ Updated to compact premium Emerald theme button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card details navigation
                    handleRepay(d.name);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-xs sm:text-sm active:scale-95 transition shadow-sm shadow-green-500/10"
                >
                  Repay
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* EMPTY STATE */}
        {debts.length === 0 && (
          <div className="text-center text-slate-400 dark:text-zinc-500 py-12 text-sm">
            No active debts on your ledger.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}