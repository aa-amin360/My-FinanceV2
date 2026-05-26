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
      
      <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-3xl mb-6 flex gap-3">
        <input
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-black border border-zinc-800
          rounded-2xl px-4 py-3 text-white placeholder:text-zinc-500
          outline-none focus:border-zinc-700 transition"
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="bg-black border border-zinc-800 rounded-2xl
          px-4 py-3 text-white outline-none focus:border-zinc-700
          transition"
        >
          <option value="EXPENSE">Expense</option>
          <option value="INCOME">Income</option>
        </select>

        <button
          onClick={handleCreate}
          className="px-5 py-3 bg-green-500 hover:bg-green-400 active:scale-95
          transition text-black font-semibold rounded-2xl"
        >
          Add
        </button>
      </div>

      {/* =========================
          CATEGORY TABLE
      ========================= */}      
      <div className="bg-black border border-zinc-900 rounded-3xl overflow-hidden">
        
        {/* HEADER */}
        <div className="grid grid-cols-3 px-5 py-4 text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-900">
          <div>Category</div>
          <div>Type</div>
          <div className="text-right">Total Expense</div>
        </div>

        {/* ROWS */}
        {categoryTotals.map((item, i) => (
          <div
            key={i}
            className="grid grid-cols-3 px-5 py-4 border-b border-zinc-900 hover:bg-zinc-950/60 transition-all duration-200"
          >            
            <div className="font-semibold text-white">
              {item.name}
            </div>

            <div className="text-sm text-zinc-500">
              {item.type}
            </div>

            <div className="text-right text-red-500 font-semibold">
              {item.total.toFixed(2)} Tk
            </div>
          </div>
        ))}

        {/* EMPTY */}
        {categoryTotals.length === 0 && (
          <div className="p-10 text-center text-zinc-500">
            No categories yet
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
