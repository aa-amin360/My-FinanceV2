"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import CashflowChart from "../../components/charts/CashflowChart";
import CategoryDonut from "../../components/charts/CategoryDonut";

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
  
  const savings = income - expense;

  const categoryMap: Record<string, number> = {};

    filteredTx.forEach((t: any) => {
      if (t.type !== "EXPENSE") return;
    
      const category = t.category_name || "Other";
      const amount = Number(t.amount);
    
      if (!categoryMap[category]) categoryMap[category] = 0;
      categoryMap[category] += amount;
    });
    
    const donutData = Object.keys(categoryMap).map((key) => ({
      name: key,
      value: categoryMap[key],
    }));

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4">
        <CashflowChart data={chartData} />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4">
        <h3 className="text-lg font-semibold mb-3">
          Donut Chart
        </h3>
     
        <CategoryDonut
          data={donutData}
          onSelect={(cat: string) => setSelectedCategory(cat)}
        />
      </div>
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
          : "bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300"
      }`}
    >
      {label}
    </button>
  );
}
