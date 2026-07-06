"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

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
    if (!name.trim()) return alert("Enter category name");

    await fetch("/api/categories", {
      method: "POST",
      body: JSON.stringify({ name: name.trim(), type }),
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
      <div className="w-full space-y-6 animate-fadeIn pb-16">
        
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">
            Categories
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-500">Configure your personal expense and income categories.</p>
        </div>

        {/* =========================
            CREATE CATEGORY (GLASS PANEL)
            ========================= */}
        {/* ✅ Updated to standard translucent glassmorphic panel */}
        <div
          className="
          bg-white/45 dark:bg-black/30
          border border-black/[0.05] dark:border-white/[0.04]
          backdrop-blur-md
          p-4 rounded-3xl flex gap-3 shadow-sm shadow-black/[0.01]
          "
        >
          <input
            placeholder="Category name (e.g. Food)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            // ✅ Applied subtle glass inner-shading to the input
            className="
            w-full
            bg-black/[0.02] dark:bg-white/[0.02]
            border border-black/[0.05] dark:border-white/[0.04]
            backdrop-blur-sm
            rounded-2xl
            px-4 py-3
            text-black dark:text-white
            placeholder:text-gray-400 dark:placeholder:text-zinc-500
            outline-none
            focus:bg-white dark:focus:bg-zinc-950
            transition-all duration-200
            text-sm
            "
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            // ✅ Applied subtle glass inner-shading to the selector
            className="
            bg-black/[0.02] dark:bg-white/[0.02]
            border border-black/[0.05] dark:border-white/[0.04]
            backdrop-blur-sm
            rounded-2xl
            px-4 py-3
            text-black dark:text-white
            outline-none
            focus:bg-white dark:focus:bg-zinc-950
            transition-all duration-200
            text-sm cursor-pointer
            "
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>

          <button
            onClick={handleCreate}
            // ✅ Updated to use the premium Emerald theme
            className="
            px-6 py-3
            bg-green-500
            hover:bg-green-400
            active:scale-95
            transition-all duration-200
            text-black
            font-bold
            text-sm
            rounded-2xl shrink-0 shadow-md shadow-green-500/10
            "
          >
            Add
          </button>
        </div>

        {/* =========================
            CATEGORY TABLE (GLASS PANEL)
            ========================= */}
        {/* ✅ Updated to standard translucent glassmorphic panel */}
        <div
          className="
          bg-white/45 dark:bg-black/30
          border border-black/[0.05] dark:border-white/[0.04]
          backdrop-blur-md
          rounded-3xl overflow-hidden shadow-sm shadow-black/[0.01]
          "
        >
          {/* HEADER */}
          <div
            className="
            grid grid-cols-3
            px-5 py-4
            text-xs font-semibold uppercase tracking-wider
            text-slate-400 dark:text-zinc-500
            border-b border-black/[0.05] dark:border-white/[0.04]
            leading-none
            "
          >
            <div>Category</div>
            <div>Type</div>
            <div className="text-right">Total Expense</div>
          </div>

          {/* ROWS */}
          <div className="divide-y divide-slate-100 dark:divide-zinc-900/60">
            {categoryTotals.map((item, i) => (
              <div
                key={i}
                className="
                grid grid-cols-3
                px-5 py-4
                border-b border-black/[0.03] dark:border-white/[0.03]
                hover:bg-white/35 dark:hover:bg-black/35
                transition-all duration-200 text-sm
                "
              >
                <div className="font-semibold text-black dark:text-white">
                  {item.name}
                </div>

                <div className="text-xs text-slate-500 dark:text-zinc-500">
                  {item.type}
                </div>

                {/* ✅ Updated total text to use Rose Crimson instead of neon red */}
                <div className="text-right text-rose-600 dark:text-rose-400 font-bold">
                  {item.total.toFixed(2)} Tk
                </div>
              </div>
            ))}
          </div>

          {/* EMPTY */}
          {categoryTotals.length === 0 && (
            <div className="p-12 text-center text-slate-400 dark:text-zinc-500 text-sm">
              No categories configured yet.
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}