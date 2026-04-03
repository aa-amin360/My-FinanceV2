"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import CashflowChart from "../../components/charts/CashflowChart";

type Transaction = {
  id: string;
  type: string;
  amount: string;
  date: string;
};

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => setTransactions(data.data || []));
  }, []);

  // =========================
  // CALCULATIONS
  // =========================

  let income = 0;
  let expense = 0;

  const monthlyMap: Record<string, { income: number; expense: number }> = {};

  transactions.forEach((t) => {
    const amount = Number(t.amount);
    const date = new Date(t.date);
    const month = date.toLocaleString("default", { month: "short" });

    if (!monthlyMap[month]) {
      monthlyMap[month] = { income: 0, expense: 0 };
    }

    if (t.type === "INCOME") {
      income += amount;
      monthlyMap[month].income += amount;
    }

    if (t.type === "EXPENSE") {
      expense += amount;
      monthlyMap[month].expense += amount;
    }
  });

  const chartData = Object.keys(monthlyMap).map((month) => ({
    month,
    income: monthlyMap[month].income,
    expense: monthlyMap[month].expense,
  }));

  const savings = income - expense;

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Reports</h1>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Box label="Total Income" value={income} color="text-green-500" />
        <Box label="Total Expense" value={expense} color="text-red-500" />
        <Box label="Net Savings" value={savings} color="text-blue-500" />
        <Box label="Transactions" value={transactions.length} color="text-gray-500" />
      </div>

      {/* CHART */}
      <CashflowChart data={chartData} />
    </DashboardLayout>
  );
}

// =========================
// COMPONENT
// =========================

function Box({ label, value, color }: any) {
  return (
    <div className="bg-gray-100 dark:bg-slate-900 p-5 rounded-2xl">
      <p className="text-sm text-gray-500">{label}</p>
      <h2 className={`text-2xl font-bold mt-2 ${color}`}>
        {value.toFixed ? value.toFixed(2) : value}
      </h2>
    </div>
  );
}
