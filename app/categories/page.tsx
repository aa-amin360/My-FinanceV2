"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Dropdown from "@/components/ui/Dropdown";
import { formatMoney } from "@/lib/config";

type Category = {
  id: number;
  name: string;
  type: string;
  // All-time total of the user's transactions in this category
  total: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");

  // Load categories together with their totals
  const load = () => {
    fetch("/api/categories", { cache: "no-store" })
      .then((res) => res.json())
      .then((d) => setCategories(d.data || []))
      .catch((err) => console.error("Failed to load categories:", err));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Enter a category name.");
      return;
    }

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), type }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to create category.");
      return;
    }

    setError("");
    setName("");
    load();
  };

  const categoryTotals = categories.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    total: Number(c.total || 0),
  }));

  const typeOptions = [
    { value: "EXPENSE", label: "Expense" },
    { value: "INCOME", label: "Income" },
  ];

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 animate-fadeIn pb-16">
        
        {/* Header Section */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">
            Categories
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-500">Configure your personal expense and income categories.</p>
        </div>

        {/* Create Category Panel (Updated with relative z-20 to fix dropdown stacking) */}
        <div
          className="
            bg-white/45 dark:bg-black/30
            border border-black/[0.05] dark:border-white/[0.04]
            backdrop-blur-md
            p-4 rounded-3xl shadow-sm shadow-black/[0.01]
            grid grid-cols-12 gap-3 items-end
            relative z-20
          "
        >
          {/* Category Name Input */}
          <div className="col-span-12 sm:col-span-6 flex flex-col gap-1.5 text-left">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">
              Category Name
            </span>
            <input
              placeholder="e.g. Food, Groceries, Salary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="
                w-full h-[46px]
                bg-black/[0.02] dark:bg-white/[0.02]
                border border-black/[0.05] dark:border-white/[0.04]
                backdrop-blur-sm
                rounded-2xl
                px-4
                text-black dark:text-white
                placeholder:text-gray-400 dark:placeholder:text-zinc-500
                outline-none
                focus:bg-white dark:focus:bg-zinc-950
                transition-all duration-200
                text-sm
              "
            />
          </div>

          {/* Category Type (Using Reusable Dropdown) */}
          <div className="col-span-12 sm:col-span-4">
            <Dropdown
              label="Category Type"
              options={typeOptions}
              selectedValue={type}
              onChange={(val) => setType(val)}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleCreate}
            className="
              col-span-12 sm:col-span-2
              h-[46px] w-full
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
            Add Category
          </button>
        </div>

        {error && <div className="text-sm font-semibold text-red-500 px-1">{error}</div>}

        {/* Categories Listing Table */}
        <div
          className="
            bg-white/45 dark:bg-black/30
            border border-black/[0.05] dark:border-white/[0.04]
            backdrop-blur-md
            rounded-3xl overflow-hidden shadow-sm shadow-black/[0.01]
          "
        >
          {/* Table Header */}
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
            <div className="text-right">Total</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-100 dark:divide-zinc-900/60">
            {categoryTotals.map((item) => (
              <div
                key={item.id}
                className="
                  grid grid-cols-3 items-center
                  px-5 py-4
                  border-b border-black/[0.03] dark:border-white/[0.03]
                  hover:bg-white/35 dark:hover:bg-black/35
                  transition-all duration-200 text-sm
                "
              >
                <div className="font-semibold text-black dark:text-white">
                  {item.name}
                </div>

                <div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                    item.type === "INCOME" 
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" 
                      : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                  }`}>
                    {item.type}
                  </span>
                </div>

                <div className={`text-right font-bold ${item.type === "INCOME" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {formatMoney(item.total)}
                </div>
              </div>
            ))}
          </div>

          {/* Empty state indicator */}
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