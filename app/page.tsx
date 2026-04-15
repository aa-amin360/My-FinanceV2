"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import CashflowChart from "../components/charts/CashflowChart";
import Link from "next/link";

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

  // ================= LOAD DATA =================
  const loadData = async () => {
    const tx = await fetch("/api/transactions").then((r) => r.json());
    setTransactions(tx.data || []);

    const b = await fetch("/api/balance").then((r) => r.json());
    setBalance(Number(b.total || 0));

    const d = await fetch("/api/debts").then((r) => r.json());
    setDebt(Number(d.total || 0));

    const r = await fetch("/api/receivables").then((r) => r.json());
    setReceivable(Number(r.total || 0));
  };

  useEffect(() => {
    loadData();

    const refresh = () => loadData();
    window.addEventListener("refreshData", refresh);

    return () => window.removeEventListener("refreshData", refresh);
  }, []);

  // ================= CALCULATIONS =================
  let income = 0;
  let expense = 0;

  transactions.forEach((t) => {
    const amt = Number(t.amount);
  
    // INCOME FLOW
    if (
      t.type === "INCOME" ||
      t.type === "DEBT_TAKEN" ||
      t.type === "RECEIVABLE_RECEIVED"
    ) {
      income += amt;
    }
  
    // EXPENSE FLOW
    if (
      t.type === "EXPENSE" ||
      t.type === "DEBT_REPAID" ||
      t.type === "RECEIVABLE_GIVEN"
    ) {
      expense += amt;
    }
  });

  const chartData = transactions
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  .map((t, index, arr) => {
    const isPositive =
      t.type === "INCOME" ||
      t.type === "DEBT_TAKEN" ||
      t.type === "RECEIVABLE_RECEIVED";

    const amount = Number(t.amount);

    const prev = index === 0 ? 0 : (arr[index - 1] as any).balance || 0;

    const balance = isPositive ? prev + amount : prev - amount;

    (t as any).balance = balance;

    return {
      date: new Date(t.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      balance,
    };
  });

  return (
    <DashboardLayout>
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
          {transactions.slice(0, 5).map((t) => {
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
      
            const getDisplayName = (t: any) => {
              if (t.entity_name) return t.entity_name;
              if (t.category_name) return t.category_name;
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
              </div>
            );
          })}
        </div>
      </div>
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
