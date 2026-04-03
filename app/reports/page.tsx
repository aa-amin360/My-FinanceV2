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
  const [filter, setFilter] = useState<"MONTH" | "YEAR" | "ALL">("ALL");

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => setTransactions(data.data || []));
  }, []);

  // =========================
  // FILTER LOGIC
  // =========================

  const now = new Date();

  const filteredTx = transactions.filter((t) => {
    const date = new Date(t.date);

    if (filter === "MONTH") {
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }

    if (filter === "YEAR") {
      return date.getFullYear() === now.getFullYear();
    }

    return true; // ALL
  });

  // =========================
  // CALCULATIONS
  // =========================

  let income = 0;
  let expense = 0;

  const monthlyMap: Record<string, { income: number; expense: number }> = {};

  filteredTx.forEach((t) => {
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
      <h1 className="text-2xl font-bold mb-4">Reports</h1>

      {/* FILTERS */}
      <div className="flex gap-2 mb-6">
        <FilterBtn
          label="This Month"
          active={filter === "MONTH"}
          onClick={() => setFilter("MONTH")}
        />
        <FilterBtn
          label="This Year"
          active={filter === "YEAR"}
          onClick={() => setFilter("YEAR")}
        />
        <FilterBtn
          label="All"
          active={filter === "ALL"}
          onClick={() => setFilter("ALL")}
        />
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Box label="Total Income" value={income} color="text-green-500" />
        <Box label="Total Expense" value={expense} color="text-red-500" />
        <Box label="Net Savings" value={savings} color="text-blue-500" />
        <Box label="Transactions" value={filteredTx.length} color="text-gray-500" />
      </div>

      {/* CHART */}
      <CashflowChart data={chartData} />
    </DashboardLayout>
  );
}

// =========================
// COMPONENTS
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

function FilterBtn({ label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-sm transition ${
        active
          ? "bg-green-500 text-black"
          : "bg-gray-200 dark:bg-slate-800"
      }`}
    >
      {label}
    </button>
  );
}
