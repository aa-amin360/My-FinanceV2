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
    // 1. Get correct entity name
    const res1 = await fetch("/api/debts/details", { cache: "no-store" });
    const debtData = await res1.json();
  
    const entity = (debtData.data || []).find(
      (d: any) => d.entity_id === id
    );
  
    setName(entity?.name || "");
  
    // 2. Load transactions
    const res2 = await fetch("/api/transactions", { cache: "no-store" });
    const txData = await res2.json();
  
    const filtered = (txData.data || []).filter(
      (t: Transaction) =>
        t.entity_id === id &&
        (t.type === "DEBT_TAKEN" || t.type === "DEBT_REPAID")
    );
  
    setTransactions(filtered);
  };

  useRefresh(loadData);

  // =========================
  // CALCULATIONS
  // =========================
  let totalTaken = 0;
  let totalRepaid = 0;

  transactions.forEach((t) => {
    const amount = Number(t.amount);

    if (t.type === "DEBT_TAKEN") {
      totalTaken += amount;
    }

    if (t.type === "DEBT_REPAID") {
      totalRepaid += amount;
    }
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
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/debts")}
          className="p-2 rounded-lg bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 transition active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>

        <h1 className="text-2xl font-bold">Debt Details</h1>
      </div>

      {/* SUMMARY */}
      <div className="bg-gray-100 dark:bg-slate-900 p-5 rounded-2xl mb-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {formatName(name)}
          </h3>

          <button
            onClick={handleRepay}
            className="px-3 py-1 rounded bg-green-500 text-black text-sm"
          >
            Repay
          </button>
        </div>

        <div className="mt-4 text-sm flex justify-between text-gray-600 dark:text-gray-400">
          <span>Total Taken:</span>
          <span>{totalTaken.toFixed(2)} Tk</span>
        </div>

        <div className="text-sm flex justify-between text-gray-600 dark:text-gray-400">
          <span>Total Repaid:</span>
          <span>{totalRepaid.toFixed(2)} Tk</span>
        </div>

        <div className="text-sm flex justify-between">
          <span>Remaining:</span>
          <span className="text-red-500 font-semibold">
            {remaining.toFixed(2)} Tk
          </span>
        </div>
      </div>

      {/* TRANSACTIONS */}
      <div className="flex flex-col gap-3">
        {transactions.map((t) => {
          const amount = Number(t.amount);

          return (
            <div
              key={t.id}
              className="flex justify-between p-4 rounded-xl bg-gray-200 dark:bg-slate-800"
            >
              <div>
                <div className="text-sm font-medium">
                  {t.type.replace("_", " ")}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(t.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </div>
              </div>

              <div
                className={`font-semibold ${
                  t.type === "DEBT_REPAID"
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {t.type === "DEBT_REPAID" ? "-" : "+"}
                {amount.toFixed(2)} Tk
              </div>
            </div>
          );
        })}
      </div>

      {transactions.length === 0 && (
        <div className="text-center text-gray-400 mt-10">
          No transactions found
        </div>
      )}
    </DashboardLayout>
  );
}
