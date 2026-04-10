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

  const monthlyMap: Record<string, any> = {};

  transactions.forEach((t) => {
    const amt = Number(t.amount);
    const month = new Date(t.date).toLocaleString("default", {
      month: "short",
    });

    if (!monthlyMap[month]) {
      monthlyMap[month] = { income: 0, expense: 0 };
    }

    if (t.type === "INCOME") {
      income += amt;
      monthlyMap[month].income += amt;
    }

    if (t.type === "EXPENSE") {
      expense += amt;
      monthlyMap[month].expense += amt;
    }
  });

  const chartData = Object.keys(monthlyMap).map((m) => ({
    month: m,
    income: monthlyMap[m].income,
    expense: monthlyMap[m].expense,
  }));

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

        <div className="bg-gray-100 dark:bg-slate-900 rounded-2xl overflow-hidden">
          {transactions.slice(0, 5).map((t) => {
            const isPositive =
              t.type === "INCOME" ||
              t.type === "DEBT_TAKEN" ||
              t.type === "RECEIVABLE_RECEIVED";

            return (
              <div
                key={t.id}
                className="flex justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-800"
              >
                <div>
                  <p className="font-medium">{t.type}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(t.date).toDateString()}
                  </p>
                </div>

                <div
                  className={`font-semibold ${
                    isPositive ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {isPositive ? "+" : "-"}
                  {Number(t.amount).toFixed(2)} Tk
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
