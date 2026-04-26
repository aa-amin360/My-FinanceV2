"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

export default function ReceivableDetailPage() {
  const router = useRouter();
  const { id } = useParams();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [name, setName] = useState("");

  // =========================
  // LOAD DATA
  // =========================
  const loadData = async () => {
    // 1. load receivable list
    const res1 = await fetch("/api/receivables/details", { cache: "no-store" });
    const receivableData = await res1.json();
  
    const entity = (receivableData.data || []).find(
      (e: any) => e.entity_id === id
    );
  
    setName(entity?.name || "");
  
    // 2. load transactions
    const res2 = await fetch("/api/transactions", { cache: "no-store" });
    const txData = await res2.json();
  
    const filtered = (txData.data || []).filter(
      (t: Transaction) =>
        t.entity_id === id &&
        (t.type === "RECEIVABLE_GIVEN" ||
          t.type === "RECEIVABLE_RECEIVED")
    );
  
    setTransactions(filtered);
  };

  useRefresh(loadData);

  // =========================
  // CALCULATIONS
  // =========================
  let totalGiven = 0;
  let totalReceived = 0;

  transactions.forEach((t) => {
    const amount = Number(t.amount);

    if (t.type === "RECEIVABLE_GIVEN") {
      totalGiven += amount;
    }

    if (t.type === "RECEIVABLE_RECEIVED") {
      totalReceived += amount;
    }
  });

  const remaining = totalGiven - totalReceived;

  // =========================
  // RECEIVE ACTION
  // =========================
  const handleReceive = () => {
    if (!name) return;
  
    window.dispatchEvent(
      new CustomEvent("openAdd", {
        detail: {
          type: "RECEIVABLE_RECEIVED",
          entity: name,
        },
      })
    );
  };

  // =========================
  // FORMAT
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
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/receivables")}
          className="p-2 rounded-lg bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 transition"
        >
          <ArrowLeft size={18} />
        </button>
      
        <h1 className="text-2xl font-bold">Receivable Details</h1>
      </div>

      {/* SUMMARY CARD */}
      <div className="bg-gray-100 dark:bg-slate-900 p-5 rounded-2xl mb-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {formatName(name)}
          </h3>

          <button
            onClick={handleReceive}
            className="px-3 py-1 rounded bg-blue-500 text-black text-sm"
          >
            Receive
          </button>
        </div>

        <div className="mt-4 text-sm flex justify-between text-gray-600 dark:text-gray-400">
          <span>Total Given:</span>
          <span>{totalGiven.toFixed(2)} Tk</span>
        </div>

        <div className="text-sm flex justify-between text-gray-600 dark:text-gray-400">
          <span>Total Received:</span>
          <span>{totalReceived.toFixed(2)} Tk</span>
        </div>

        <div className="text-sm flex justify-between">
          <span>Remaining:</span>
          <span className="text-yellow-500 font-semibold">
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
                  {new Date(t.date).toDateString()}
                </div>
              </div>

              <div
                className={`font-semibold ${
                  t.type === "RECEIVABLE_RECEIVED"
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {t.type === "RECEIVABLE_RECEIVED" ? "+" : "-"}
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
