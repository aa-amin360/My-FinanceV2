"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";

type Category = {
  id: string;
  name: string;
  type: string;
};

type Transaction = {
  amount: string;
  type: string;
  category_id: string | null;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [name, setName] = useState("");
  const [type, setType] = useState("EXPENSE");

  // =========================
  // LOAD DATA
  // =========================
  const load = () => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((d) => setCategories(d.data || []));

    fetch("/api/transactions")
      .then((res) => res.json())
      .then((d) => setTransactions(d.data || []));
  };

  useEffect(() => {
    load();
  }, []);

  // =========================
  // CREATE CATEGORY
  // =========================
  const handleCreate = async () => {
    if (!name) return alert("Enter category name");

    await fetch("/api/categories", {
      method: "POST",
      body: JSON.stringify({ name, type }),
    });

    setName("");
    load();
  };

  // =========================
  // CALCULATE EXPENSE TOTALS
  // =========================
  const categoryTotals = categories.map((c) => {
    const total = transactions
      .filter(
        (t) =>
          t.type === "EXPENSE" && t.category_id === c.id
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      name: c.name,
      type: c.type,
      total,
    };
  });

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Categories</h1>

      {/* =========================
          CREATE CATEGORY
      ========================= */}
      <div className="bg-gray-100 dark:bg-slate-900 p-4 rounded-2xl mb-6 flex gap-2">
        <input
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 rounded w-full bg-gray-200 dark:bg-slate-800"
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="p-2 rounded bg-gray-200 dark:bg-slate-800"
        >
          <option value="EXPENSE">Expense</option>
          <option value="INCOME">Income</option>
        </select>

        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-green-500 text-black rounded"
        >
          Add
        </button>
      </div>

      {/* =========================
          CATEGORY TABLE
      ========================= */}
      <div className="bg-gray-100 dark:bg-slate-900 rounded-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="grid grid-cols-3 px-4 py-3 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-slate-800">
          <div>Category</div>
          <div>Type</div>
          <div className="text-right">Total Expense</div>
        </div>

        {/* ROWS */}
        {categoryTotals.map((item, i) => (
          <div
            key={i}
            className="grid grid-cols-3 px-4 py-3 border-b border-gray-200 dark:border-slate-800 hover:bg-gray-200 dark:hover:bg-slate-800 transition"
          >
            <div className="font-medium">{item.name}</div>

            <div className="text-sm text-gray-500">
              {item.type}
            </div>

            <div className="text-right text-red-500 font-semibold">
              {item.total.toFixed(2)} Tk
            </div>
          </div>
        ))}

        {/* EMPTY */}
        {categoryTotals.length === 0 && (
          <div className="p-6 text-center text-gray-400">
            No categories yet
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
