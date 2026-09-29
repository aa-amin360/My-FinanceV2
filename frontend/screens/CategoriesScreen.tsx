"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/frontend/components/templates/DashboardLayout";
import PageHeader from "@/frontend/components/molecules/PageHeader";
import CategoryForm from "@/frontend/components/organisms/CategoryForm";
import CategoryTable from "@/frontend/components/organisms/CategoryTable";
import { categoriesApi } from "@/frontend/api/categories";
import { errorMessage } from "@/frontend/api/client";
import type { Category } from "@/shared/apiTypes";

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");

  // Categories together with their totals
  const load = () => {
    categoriesApi
      .list()
      .then(setCategories)
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

    try {
      await categoriesApi.create(name.trim(), type);
    } catch (err) {
      setError(errorMessage(err, "Failed to create category."));
      return;
    }

    setError("");
    setName("");
    load();
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 animate-fadeIn pb-16">
        <PageHeader title="Categories" subtitle="Configure your personal expense and income categories." />

        <CategoryForm name={name} type={type} onNameChange={setName} onTypeChange={setType} onSubmit={handleCreate} />

        {error && <div className="text-sm font-semibold text-red-500 px-1">{error}</div>}

        <CategoryTable categories={categories} />
      </div>
    </DashboardLayout>
  );
}
