"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";

type Transaction = {
  id: string;
  type: string;
  amount: string;
  category: string | null;
};

export default function CategoriesPage() {
  const [data, setData] = useState<
    { category: string; total: number }[]
  >([]);

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((res) => {
        const transactions = res.data || [];

        const map: Record<string, number> = {};

        transactions.forEach((t: any) => {
          if (t.type !== "EXPENSE") return;

          const category = t.category || "Other";
          const amount = Number(t.amount);

          if (!map[category]) map[category] = 0;
          map[category] += amount;
        });

        const result = Object.keys(map).map((key) => ({
          category: key,
          total: map[key],
        }));

        setData(result);
      });
  }, []);

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Categories</h1>

      <div className="bg-gray-100 dark:bg-slate-900 rounded-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="grid grid-cols-2 px-4 py-3 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-slate-800">
          <div>Category</div>
          <div className="text-right">Total Expense</div>
        </div>

        {/* ROWS */}
        {data.map((item, i) => (
          <div
            key={i}
            className="grid grid-cols-2 px-4 py-3 border-b border-gray-200 dark:border-slate-800 hover:bg-gray-200 dark:hover:bg-slate-800 transition"
          >
            <div className="font-medium">{item.category}</div>

            <div className="text-right text-red-500 font-semibold">
              {item.total.toFixed(2)} Tk
            </div>
          </div>
        ))}

        {/* EMPTY STATE */}
        {data.length === 0 && (
          <div className="p-6 text-center text-gray-400">
            No expense data yet
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
