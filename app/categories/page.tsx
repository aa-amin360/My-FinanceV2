"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("EXPENSE");

  const load = () => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((d) => setCategories(d.data || []));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!name) return alert("Enter category name");

    await fetch("/api/categories", {
      method: "POST",
      body: JSON.stringify({ name, type }),
    });

    setName("");
    load();
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Categories</h1>

      {/* CREATE */}
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

      {/* LIST */}
      <div className="bg-gray-100 dark:bg-slate-900 rounded-2xl">
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex justify-between px-4 py-3 border-b dark:border-slate-800"
          >
            <span>{c.name}</span>
            <span className="text-sm text-gray-500">{c.type}</span>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="p-4 text-gray-400">No categories yet</div>
        )}
      </div>
    </DashboardLayout>
  );
}
