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

export default function ReceivableDetailPage() {
  const router = useRouter();
  const { id } = useParams();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [name, setName] = useState("");

  // =========================
  // LOAD DATA
  // =========================
  const loadData = async () => {
    try {
      // Fire requests in parallel
      const [detailsRes, txRes] = await Promise.all([
        fetch("/api/receivables/details", { cache: "no-store" }),
        fetch("/api/transactions", { cache: "no-store" }),
      ]);

      const [receivableData, txData] = await Promise.all([
        detailsRes.json(),
        txRes.json(),
      ]);

      const entity = (receivableData.data || []).find(
        (e: any) => e.entity_id === id
      );
      setName(entity?.name || "");

      const filtered = (txData.data || []).filter(
        (t: Transaction) =>
          t.entity_id === id &&
          (t.type === "RECEIVABLE_GIVEN" ||
            t.type === "RECEIVABLE_RECEIVED")
      );
      setTransactions(filtered);
    } catch (err) {
      console.error("Failed to load receivable details in parallel:", err);
    }
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
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/receivables")}
          className="
          p-2 rounded-xl
          bg-gray-100 dark:bg-zinc-900
          border border-gray-200 dark:border-zinc-800
          hover:bg-gray-200 dark:hover:bg-zinc-800
          transition active:scale-95
          "
        >
          <ArrowLeft
            size={18}
            className="text-black dark:text-white"
          />
        </button>
      
        <h1 className="text-2xl font-bold text-black dark:text-white">
          Receivable Details
        </h1>
      </div>
      
      {/* SUMMARY CARD */}
      <div
        className="
        bg-white dark:bg-black
        border border-gray-200 dark:border-zinc-900
        p-6 rounded-3xl mb-6
        "
      >
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-black dark:text-white">
            {formatName(name)}
          </h3>
      
          <button
            onClick={handleReceive}
            className="
            px-4 py-2 rounded-xl
            bg-blue-500 hover:bg-blue-400
            text-black text-sm font-medium
            transition active:scale-95
            "
          >
            Receive
          </button>
        </div>
      
        <div className="mt-6 space-y-3">
      
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-zinc-500">
              Total Given
            </span>
      
            <span className="text-black dark:text-white font-medium">
              {totalGiven.toFixed(2)} Tk
            </span>
          </div>
      
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-zinc-500">
              Total Received
            </span>
      
            <span className="text-black dark:text-white font-medium">
              {totalReceived.toFixed(2)} Tk
            </span>
          </div>
      
          <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-zinc-900">
            <span className="text-black dark:text-white font-medium">
              Remaining
            </span>
      
            <span className="text-yellow-500 font-semibold">
              {remaining.toFixed(2)} Tk
            </span>
          </div>
      
        </div>
      </div>
      
      {/* TRANSACTIONS */}
      <div className="flex flex-col gap-3">
        {transactions.map((t) => {
          const amount = Number(t.amount);
      
          return (
            <div
              key={t.id}
              className="
              flex justify-between items-center
              p-4 rounded-2xl
              bg-white dark:bg-zinc-950
              border border-gray-200 dark:border-zinc-900
              hover:bg-gray-50 dark:hover:bg-zinc-900/60
              transition
              "
            >
              <div>
                <div className="text-sm font-semibold text-black dark:text-white">
                  {t.type.replace("_", " ")}
                </div>
      
                <div className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
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
