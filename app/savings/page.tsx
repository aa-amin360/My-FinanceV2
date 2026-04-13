"use client";

import DashboardLayout from "../../components/layout/DashboardLayout";

export default function SavingsPage() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Savings</h1>

      {/* EMPTY STATE (for now) */}
      <div className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-6">
        <p className="text-gray-500 dark:text-gray-400">
          No savings plans yet
        </p>
      </div>
    </DashboardLayout>
  );
}
