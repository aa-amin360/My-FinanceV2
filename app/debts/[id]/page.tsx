"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { useRefresh } from "@/hooks/useRefresh";
import { ArrowLeft } from "lucide-react";

type Transaction = {
  id: string;
  type: string;
  amount: string;
  date: string;
  note: string | null;
  entity_id: string | null;
};

export default function DebtDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [name, setName] = useState("");

  // =========================
  // LOAD DATA
  // =========================
  const loadData = async () => {
    try {
      // Fire requests in parallel
      const [detailsRes, txRes] = await Promise.all([
        fetch("/api/debts/details", { cache: "no-store" }),
        fetch("/api/transactions", { cache: "no-store" }),
      ]);

      const [debtData, txData] = await Promise.all([
        detailsRes.json(),
        txRes.json(),
      ]);

      const entity = (debtData.data || []).find(
        (d: any) => d.entity_id === id
      );
      setName(entity?.name || "");

      const filtered = (txData.data || []).filter(
        (t: Transaction) =>
          t.entity_id === id &&
          (t.type === "DEBT_TAKEN" || t.type === "DEBT_REPAID")
      );
      setTransactions(filtered);
    } catch (err) {
      console.error("Failed to load debt details in parallel:", err);
    }
  };

  useRefresh(loadData);

  // =========================
  // CALCULATIONS
  // =========================
  let totalTaken = 0;
  let totalRepaid = 0;

  transactions.forEach((t) => {
    const amount = Number(t.amount);
    if (t.type === "DEBT_TAKEN") totalTaken += amount;
    if (t.type === "DEBT_REPAID") totalRepaid += amount;
  });

  const remaining = totalTaken - totalRepaid;

  // =========================
  // REPAY ACTION
  // =========================
  const handleRepay = () => {
    window.dispatchEvent(
      new CustomEvent("openAdd", {
        detail: {
          type: "DEBT_REPAID",
          entity: name,
        },
      })
    );
  };

  // =========================
  // FORMAT NAME
  // =========================
  const formatName = (text: string) => {
    return text
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 animate-fadeIn pb-16">
        
        {/* HEADER */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/debts")}
            className="
              p-2 rounded-xl
              bg-black/[0.03] dark:bg-white/[0.03]
              border border-black/[0.04] dark:border-white/[0.04]
              hover:bg-black/[0.06] dark:hover:bg-white/[0.06]
              transition active:scale-95
            "
          >
            <ArrowLeft size={18} className="text-black dark:text-white" />
          </button>
        
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">
            Debt Details
          </h1>
        </div>
        
        {/* SUMMARY CARD (GLASS) */}
        {/* ✅ Updated to standard translucent glassmorphic panel */}
        <div
          className="
          bg-white/45 dark:bg-black/35
          border border-black/[0.05] dark:border-white/[0.04]
          backdrop-blur-md p-6 rounded-3xl
          shadow-sm shadow-black/[0.01]
          "
        >
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-black dark:text-white leading-none">
              {formatName(name)}
            </h3>
        
            {/* REPAY BUTTON */}
            {/* ✅ Updated to compact premium Emerald theme button */}
            <button
              onClick={handleRepay}
              className="
              px-4 py-2 rounded-xl
              bg-green-500 hover:bg-green-400
              text-black text-sm font-bold
              transition active:scale-95 shadow-sm shadow-green-500/10
              "
            >
              Repay
            </button>
          </div>
        
          <div className="mt-6 space-y-3">
        
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 dark:text-zinc-500">
                Total Taken
              </span>
        
              <span className="text-black dark:text-white font-semibold">
                {totalTaken.toLocaleString("en-BD")} Tk
              </span>
            </div>
        
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 dark:text-zinc-500">
                Total Repaid
              </span>
        
              <span className="text-black dark:text-white font-semibold">
                {totalRepaid.toLocaleString("en-BD")} Tk
              </span>
            </div>
        
            {/* ✅ Updated remaining total text to premium Rose Crimson instead of neon red */}
            <div className="flex justify-between pt-3 border-t border-black/[0.04] dark:border-white/[0.04]">
              <span className="text-slate-500 dark:text-zinc-400 font-bold">
                Remaining
              </span>
        
              <span className="text-rose-600 dark:text-rose-400 font-extrabold text-lg sm:text-xl">
                {remaining.toLocaleString("en-BD")} Tk
              </span>
            </div>
        
          </div>
        </div>
        
        {/* TRANSACTIONS LIST */}
        <div className="flex flex-col gap-3">
          {transactions.map((t) => {
            const amount = Number(t.amount);
            const isRepaid = t.type === "DEBT_REPAID";
        
            return (
              // ✅ Updated transaction rows to subtle transparent inner-glass style
              <div
                key={t.id}
                className="
                flex justify-between items-center
                p-4 rounded-2xl
                bg-white/25 dark:bg-zinc-950/10
                border border-black/[0.03] dark:border-white/[0.03]
                backdrop-blur-sm
                hover:bg-white/35 dark:hover:bg-zinc-950/20
                transition duration-200
                "
              >
                <div>
                  <div className="text-sm font-semibold text-black dark:text-white">
                    {t.type.replace("_", " ")}
                  </div>
        
                  <div className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                    {new Date(t.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </div>
                </div>
        
                {/* ✅ Updated colors to premium Emerald and Rose Crimson */}
                <div
                  className={`font-bold text-base ${
                    isRepaid ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {isRepaid ? "-" : "+"}
                  {amount.toLocaleString("en-BD")} Tk
                </div>
              </div>
            );
          })}
        </div>
        
        {transactions.length === 0 && (
          <div className="text-center text-slate-400 dark:text-zinc-500 py-12 text-sm">
            No transactions found
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}