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
  category_name?: string;
  parent_id?: string | null;
};

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [range, setRange] = useState<"ALL" | "YEAR" | "MONTH">("MONTH");

  // ================= FETCH =================
  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => setTransactions(data.data || []));
  }, []);

  // ================= FILTER =================
  const now = new Date();

  const filteredTx = transactions.filter((t) => {
    const date = new Date(t.date);

    if (range === "MONTH") {
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }

    if (range === "YEAR") {
      return date.getFullYear() === now.getFullYear();
    }

    return true;
  });

  // ================= CALCULATIONS =================
  let income = 0;
  let expense = 0;

  filteredTx.forEach((t) => {
    const amount = Number(t.amount);

    if (t.type === "INCOME") income += amount;
    if (t.type === "EXPENSE") expense += amount;
  });

  // ================= DONUT =================
  const categoryMap: Record<string, number> = {};

  filteredTx.forEach((t) => {
    if (t.type !== "EXPENSE") return;

    const category = t.category_name || "Other";
    const amount = Number(t.amount);

    categoryMap[category] = (categoryMap[category] || 0) + amount;
  });

  const donutData = Object.keys(categoryMap).map((key) => ({
    name: key,
    value: categoryMap[key],
  }));

  // ================= CHART =================
  // Filter out parents with children to prevent double-counting, leaving only active nodes
  const parentIdsWithChildren = new Set(
    filteredTx
      .filter((t) => t.parent_id)
      .map((t) => {
        // Find the parent transaction object from the MASTER transactions state array
        const parent = transactions.find((p) => p.id === t.parent_id);
        // Only exclude the parent if its type is a split (DEBT_REPAID or RECEIVABLE_RECEIVED)
        if (parent && (parent.type === "DEBT_REPAID" || parent.type === "RECEIVABLE_RECEIVED")) {
          return parent.id;
        }
        return null;
      })
      .filter(Boolean)
  );

  const activeFilteredTx = filteredTx.filter(
    (t) => t.parent_id || !parentIdsWithChildren.has(t.id)
  );
  
  const chartData = activeFilteredTx
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

  // ================= UI =================
  return (
    <DashboardLayout>

      <div className="flex flex-col gap-6">
      
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black dark:text-white">
            Reports
          </h1>
      
          <div className="flex gap-2">
            <FilterBtn
              label="All"
              active={range === "ALL"}
              onClick={() => setRange("ALL")}
            />
      
            <FilterBtn
              label="This Year"
              active={range === "YEAR"}
              onClick={() => setRange("YEAR")}
            />
      
            <FilterBtn
              label="This Month"
              active={range === "MONTH"}
              onClick={() => setRange("MONTH")}
            />
          </div>
        </div>
      
        {/* TOP GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      
          {/* DONUT */}
          <div
            className="
            order-2 md:order-1 md:col-span-2
            bg-white dark:bg-black
            border border-gray-200 dark:border-zinc-900
            rounded-3xl p-5
            "
          >
            <h3 className="mb-4 text-sm text-gray-500 dark:text-zinc-500">
              Expense Breakdown
            </h3>
      
            <div
              className="
              bg-gray-50 dark:bg-zinc-950/40
              border border-gray-200 dark:border-zinc-900
              rounded-2xl p-3
              "
            >
              <CategoryDonut data={donutData} />
            </div>
          </div>
      
          {/* STATS */}
          <div className="order-1 md:order-2 grid grid-cols-2 md:flex md:flex-col gap-4">
            <Box
              label="Total Income"
              value={income}
              color="text-green-400"
            />
      
            <Box
              label="Total Expense"
              value={expense}
              color="text-red-400"
            />
          </div>
      
        </div>
      
        {/* GRAPH */}
        <div
          className="
          mt-6
          bg-white dark:bg-black
          border border-gray-200 dark:border-zinc-900
          rounded-3xl p-5
          "
        >
          <h3 className="mb-4 text-sm text-gray-500 dark:text-zinc-500">
            Balance
          </h3>
      
          <div
            className="
            bg-gray-50 dark:bg-zinc-950/40
            border border-gray-200 dark:border-zinc-900
            rounded-2xl p-2 h-[260px]
            "
          >
            <CashflowChart data={chartData} />
          </div>
        </div>
      
      </div>
      
    </DashboardLayout>
  );
}

// ================= COMPONENTS =================
function Box({ label, value, color }: any) {
  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-slate-800 p-4 rounded-2xl">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className={`text-xl font-semibold ${color}`}>
        {Number(value).toLocaleString()}
      </p>
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
          : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300"
      }`}
    >
      {label}
    </button>
  );
}
