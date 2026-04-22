"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import CashflowChart from "../components/charts/CashflowChart";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useRefresh } from "@/hooks/useRefresh";

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
  const [open, setOpen] = useState(false);

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

  useRefresh(loadData);

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
      <div className="relative">
      
        {/* MAIN CARD */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-2xl text-black cursor-pointer flex justify-between items-center"
        >
          <h1
            className={`font-bold ${
              balance > 1000000
                ? "text-2xl"
                : balance > 100000
                ? "text-3xl"
                : "text-4xl"
            }`}
          >
            {Number(balance).toLocaleString("en-BD")} Tk
          </h1>
      
          {/* dropdown arrow */}
          <div
            className={`
              w-9 h-9 flex items-center justify-center
              rounded-full border border-black/20 dark:border-white/20
              bg-white/20 dark:bg-black/20
              shadow-sm hover:shadow-md
              transition-all duration-200
              ${open ? "rotate-180" : ""}
            `}
          >
            <span className="text-sm">▼</span>
          </div>
        </div>
      
        {/* DROPDOWN */}
        {open && (
          <div className="absolute top-full left-0 w-full mt-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-gray-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden z-50">
      
            <div className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer">
              💵 Cash Balance — {Number(balance).toLocaleString("en-BD")} Tk
            </div>
      
            <div className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer">
              🏦 Bank Balance — {Number(balance).toLocaleString("en-BD")} Tk
            </div>
      
          </div>
        )}
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
                  className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                >
                  {/* LEFT */}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {getDisplayName(t)}
                    </div>
      
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                        {Number(amount).toLocaleString("en-BD")} Tk
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
          
          <div className="bg-white/90 dark:bg-slate-900/80 border border-gray-200 dark:border-slate-700 
            text-black dark:text-white backdrop-blur-xl rounded-2xl p-6 w-[320px] text-center shadow-2xl">
            
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
                className="px-5 py-2 rounded-full bg-gray-200 dark:bg-slate-700 text-black dark:text-gray-300 hover:bg-slate-600 transition"
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
  const formatted = Number(value).toLocaleString("en-BD");

  return (
    <div className="bg-gray-100 dark:bg-slate-900 p-4 sm:p-5 rounded-2xl min-w-0">
      
      {/* TITLE */}
      <p className={`${color} text-sm sm:text-base`}>
        {title}
      </p>

      {/* VALUE ROW (FIXED) */}
      <div className="mt-2 flex items-baseline gap-1">
        
        {/* NUMBER */}
        <span
          className="font-bold leading-none truncate text-[clamp(16px,5vw,22px)]"
        >
          {formatted}
        </span>

        {/* TK */}
        <span className="text-[12px] text-gray-400 shrink-0">
          Tk
        </span>

      </div>
    </div>
  );
}
