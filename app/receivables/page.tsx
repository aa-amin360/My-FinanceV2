"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";

type Receivable = {
  entity_id: string;
  name: string;
  total_amount: string;
  remaining_amount: string;
};

type Transaction = {
  id: string;
  type: string;
  amount: string;
  date: string;
  note: string | null;
  entity_id: string | null;
};

export default function ReceivablePage() {
  const [data, setData] = useState<Receivable[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // =========================
  // LOAD DATA
  // =========================
  const loadData = () => {
    fetch("/api/receivables/details", { cache: "no-store" })
      .then((res) => res.json())
      .then((d) => setData(d.data || []));

    fetch("/api/transactions", { cache: "no-store" })
      .then((res) => res.json())
      .then((d) => setTransactions(d.data || []));
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================
  // FAB LISTENER (NEW)
  // =========================
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail === "RECEIVABLE") {
        window.dispatchEvent(
          new CustomEvent("openAdd", {
            detail: "RECEIVABLE",
          })
        );
      }
    };
  
    window.addEventListener("openAdd", handler);
    return () => window.removeEventListener("openAdd", handler);
  }, []);

  // =========================
  // RECEIVE FUNCTION
  // =========================
  const handleReceive = (entityName: string) => {
    window.dispatchEvent(
      new CustomEvent("openAdd", {
        detail: {
          type: "RECEIVABLE_RECEIVED",
          entity: entityName,
        },
      })
    );
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Receivable Details</h1>

      {data.map((r) => {
        const personTx = transactions.filter(
          (t) =>
            t.entity_id === r.entity_id &&
            (t.type === "RECEIVABLE_GIVEN" ||
              t.type === "RECEIVABLE_RECEIVED")
        );

        return (
          <div
            key={r.entity_id}
            className="bg-gray-100 dark:bg-slate-900 p-5 rounded-2xl mb-6"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{r.name}</h3>

              <button
                onClick={() => handleReceive(r.name)}
                className="px-3 py-1 rounded bg-blue-500 text-black text-sm"
              >
                Receive
              </button>
            </div>

            {/* SUMMARY */}
            <div className="mt-4 flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Total Given:</span>
              <span>{Number(r.total_amount).toFixed(2)} Tk</span>
            </div>

            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Remaining:</span>
              <span className="font-semibold text-yellow-500">
                {Number(r.remaining_amount).toFixed(2)} Tk
              </span>
            </div>

            {/* TRANSACTIONS */}
            <div className="mt-4 text-sm font-semibold">
              Transactions
            </div>

            <div className="mt-2 flex flex-col gap-2">
              {personTx.map((t) => {
                const amount = Number(t.amount);

                return (
                  <div
                    key={t.id}
                    className="flex justify-between p-3 rounded-xl bg-gray-200 dark:bg-slate-800"
                  >
                    <div>
                      <div className="text-sm">
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
          </div>
        );
      })}

      {/* EMPTY STATE */}
      {data.length === 0 && (
        <div className="text-center text-gray-400">
          No receivables yet
        </div>
      )}
    </DashboardLayout>
  );
}
