"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";

type Transaction = {
  id: string;
  type: string;
  amount: string;
  date: string;
  note: string | null;
  category_name?: string;
  entity_name?: string; // ✅ NEW (if backend supports)
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // =========================
  // LOAD DATA
  // =========================
  const loadData = () => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => setTransactions(data.data || []));
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================
  // FAB LISTENER
  // =========================
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail === "TRANSACTION") {
        const type = prompt("Enter type (INCOME / EXPENSE)");
        const amount = prompt("Enter amount");

        if (!type || !amount) return;

        fetch("/api/transactions", {
          method: "POST",
          body: JSON.stringify({
            type: type.toUpperCase(),
            amount: Number(amount),
            account: "Cash",
            date: new Date().toISOString(),
            note: "Quick Transaction",
          }),
        }).then(() => loadData());
      }
    };

    window.addEventListener("openAdd", handler);
    return () => window.removeEventListener("openAdd", handler);
  }, []);

  
  // =========================
  // NAME RESOLVER (CORE FIX)
  // =========================
  const formatName = (name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
  // Priority:
  // 1. Entity (Debt / Receivable)
  // 2. Note (Expense / Income source)
  // 3. Category fallback
  // 4. Type fallback
    
  const getDisplayName = (t: Transaction) => {
    if (t.entity_name) return formatName(t.entity_name);
  
    if (t.note) return formatName(t.note);
  
    if (t.category_name) return formatName(t.category_name);
  
    return t.type.replace("_", " ");
  };

  // =========================
  // CATEGORY RESOLVER
  // =========================
  const getCategory = (t: Transaction) => {
    if (t.category_name) return t.category_name;

    // fallback to readable type
    return t.type.replace("_", " ");
  };

  // =========================
  // TYPE STYLE
  // =========================
  const getTypeStyle = (type: string) => {
    switch (type) {
      case "INCOME":
        return "bg-green-500/20 text-green-500";
      case "EXPENSE":
        return "bg-red-500/20 text-red-500";
      case "DEBT_TAKEN":
        return "bg-blue-500/20 text-blue-500";
      case "DEBT_REPAID":
        return "bg-cyan-500/20 text-cyan-500";
      case "RECEIVABLE_GIVEN":
        return "bg-yellow-500/20 text-yellow-500";
      case "RECEIVABLE_RECEIVED":
        return "bg-purple-500/20 text-purple-500";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Transactions</h1>

      <div className="bg-gray-100 dark:bg-slate-900 rounded-2xl overflow-hidden">

        {/* HEADER */}
        <div className="grid grid-cols-5 px-4 py-3 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-slate-800">
          <div>Name</div>
          <div>Date</div>
          <div>Type</div>
          <div>Category</div>
          <div className="text-right">Amount</div>
        </div>

        {/* ROWS */}
        {transactions.map((t) => {
          const amount = Number(t.amount);

          const isPositive =
            t.type === "INCOME" ||
            t.type === "DEBT_TAKEN" ||
            t.type === "RECEIVABLE_RECEIVED";

          return (
            <div
              key={t.id}
              className="grid grid-cols-5 px-4 py-3 border-b border-gray-200 dark:border-slate-800 hover:bg-gray-200 dark:hover:bg-slate-800 transition"
            >
              {/* NAME */}
              <div className="font-medium">
                {getDisplayName(t)}
              </div>

              {/* DATE */}
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(t.date).toDateString()}
              </div>

              {/* TYPE */}
              <div>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getTypeStyle(
                    t.type
                  )}`}
                >
                  {t.type.replace("_", " ")}
                </span>
              </div>

              {/* CATEGORY */}
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {getCategory(t)}
              </div>

              {/* AMOUNT */}
              <div
                className={`text-right font-semibold ${
                  isPositive ? "text-green-500" : "text-red-500"
                }`}
              >
                {isPositive ? "+" : "-"}
                {amount.toFixed(2)} Tk
              </div>
            </div>
          );
        })}

        {/* EMPTY */}
        {transactions.length === 0 && (
          <div className="p-6 text-center text-gray-400">
            No transactions yet
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
