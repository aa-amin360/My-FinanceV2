"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import CashflowChart from "../components/charts/CashflowChart";
import Link from "next/link";
import { Trash2 } from "lucide-react";

type Transaction = {
  id: string;
  type: string;
  amount: string;
  date: string;
  note: string | null;
};

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [debt, setDebt] = useState(0);
  const [receivable, setReceivable] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ================= LOAD DATA =================
  const loadData = async () => {
    const tx = await fetch("/api/transactions", { cache: "no-store" }).then((r) => r.json());
    setTransactions(tx.data || []);

    const b = await fetch("/api/balance", { cache: "no-store" }).then((r) => r.json());
    setBalance(Number(b.balance || 0));

    const d = await fetch("/api/debts", { cache: "no-store" }).then((r) => r.json());
    setDebt(Number(d.total || 0));

    const r = await fetch("/api/receivables", { cache: "no-store" }).then((r) => r.json());
    setReceivable(Number(r.total || 0));
  };

  useEffect(() => {
    loadData();
  
    const handleRefresh = () => {
      loadData();
    };
  
    window.addEventListener("refreshData", handleRefresh);
  
    return () => {
      window.removeEventListener("refreshData", handleRefresh);
    };
  }, []);

  // ================= CALCULATIONS =================
  let income = 0;
  let expense = 0;

  transactions.forEach((t) => {
    const amt = Number(t.amount);
  
    if (t.type === "INCOME") {
      income += amt;
    }
  
    if (t.type === "EXPENSE") {
      expense += amt;
    }
  });

  let runningBalance = 0;
  
  const chartData = transactions
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((t) => {
      const isPositive =
        t.type === "INCOME" ||
        t.type === "DEBT_TAKEN" ||
        t.type === "RECEIVABLE_RECEIVED";
  
      const amount = Number(t.amount);
  
      runningBalance = isPositive
        ? runningBalance + amount
        : runningBalance - amount;
  
      return {
        date: new Date(t.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        balance: runningBalance,
      };
    });
  
  const handleDelete = async (id: string) => {
    await fetch(`/api/transactions/${id}`, {
      method: "DELETE",
    });
  
    window.dispatchEvent(new Event("refreshData"));
  };

  return (
    <DashboardLayout balance={balance}>
      {/* BALANCE */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-2xl text-black">
        <h1 className="text-3xl font-bold">{balance.toFixed(2)} Tk</h1>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <Card title="Income" value={income} color="text-green-500" />
        <Card title="Expenses" value={expense} color="text-red-500" />

        <Link href="/debts">
          <Card title="Debt" value={debt} color="text-cyan-400" />
        </Link>

        <Link href="/receivables">
          <Card title="Receivable" value={receivable} color="text-yellow-400" />
        </Link>
      </div>

      {/* CHART */}
      <div className="mt-6">
        <CashflowChart data={chartData} />
      </div>

      {/* HISTORY */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Recent Transactions</h3>
      
        <div className="space-y-3">
          {[...transactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
            .map((t) => {
              const amount = Number(t.amount);
      
              const isPositive =
                t.type === "INCOME" ||
                t.type === "DEBT_TAKEN" ||
                t.type === "RECEIVABLE_RECEIVED";
      
              const formatType = (type: string) =>
                type
                  .toLowerCase()
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase());
      
              const capitalize = (text: string) =>
                text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
      
              const getDisplayName = (t: any) => {
                if (t.entity_name) return capitalize(t.entity_name);
                if (t.category_name) return capitalize(t.category_name);
                return formatType(t.type);
              };
      
              return (
                <div
                  key={t.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex justify-between items-center hover:bg-slate-800 transition"
                >
                  {/* LEFT */}
                  <div>
                    <div className="font-medium">
                      {getDisplayName(t)}
                    </div>
      
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(t.date).toDateString()}
                    </div>
                  </div>
      
                  {/* RIGHT */}
                  <div className="flex items-center gap-4">
                    
                    {/* AMOUNT + TYPE */}
                    <div className="text-right">
                      <div
                        className={`font-semibold ${
                          isPositive ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {isPositive ? "+" : "-"}
                        {amount.toFixed(2)} Tk
                      </div>
      
                      <div className="mt-1">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            t.type === "INCOME"
                              ? "bg-green-500/20 text-green-400"
                              : t.type === "EXPENSE"
                              ? "bg-red-500/20 text-red-400"
                              : t.type.includes("DEBT")
                              ? "bg-blue-500/20 text-blue-400"
                              : t.type.includes("RECEIVABLE")
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {formatType(t.type)}
                        </span>
                      </div>
                    </div>
      
                    {/* DELETE ICON (ONLY CHANGE) */}
                    <button
                      onClick={() => setDeleteId(t.id)}
                      className="p-2 rounded-full hover:bg-red-500/20 text-red-400 hover:text-red-300 transition"
                    >
                      <Trash2 size={18} />
                    </button>
      
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      
      {deleteId && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 w-[320px] text-center shadow-2xl">
            
            <h3 className="text-lg font-semibold mb-4">
              Delete this transaction?
            </h3>
      
            <div className="flex gap-3 justify-center">
              
              <button
                onClick={async () => {
                  await handleDelete(deleteId);
                  setDeleteId(null);
                }}
                className="px-5 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
              >
                Delete
              </button>
      
              <button
                onClick={() => setDeleteId(null)}
                className="px-5 py-2 rounded-full bg-slate-700 text-gray-300 hover:bg-slate-600 transition"
              >
                Cancel
              </button>
      
            </div>
      
          </div>
      
        </div>
      )}
    </DashboardLayout>
  );
}

// ================= COMPONENT =================

function Card({ title, value, color }: any) {
  return (
    <div className="bg-gray-100 dark:bg-slate-900 p-5 rounded-2xl">
      <p className={color}>{title}</p>
      <h2 className="text-2xl mt-2 font-bold">{value.toFixed(2)} Tk</h2>
    </div>
  );
}
