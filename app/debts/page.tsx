"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useRefresh } from "@/hooks/useRefresh";

type Debt = {
  entity_id: string;
  name: string;
  total_amount: string;
  remaining_amount: string;
};

export default function DebtPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const router = useRouter();

  // =========================
  // LOAD DATA
  // =========================
  const loadData = () => {
    fetch("/api/debts/details", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setDebts(data.data || []));
  };

  useRefresh(loadData);

  const formatName = (text: string) => {
    return text
      .toLowerCase()
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // =========================
  // REPAY FUNCTION
  // =========================
  const handleRepay = (entityName: string) => {
    window.dispatchEvent(
      new CustomEvent("openAdd", {
        detail: {
          type: "DEBT_REPAID",
          entity: entityName,
        },
      })
    );
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Debts</h1>

      <div className="flex flex-col gap-4">
        {debts.map((d) => (
          <div
            key={d.entity_id}
            className="bg-gray-100 dark:bg-zinc-950 border border-zinc-900 p-5 rounded-2xl flex justify-between items-center hover:bg-gray-200 dark:hover:bg-zinc-900 transition cursor-pointer"
            onClick={() => router.push(`/debts/${d.entity_id}`)}
          >
            {/* LEFT */}
            <div>
              <div className="font-semibold text-lg">
                {formatName(d.name)}
              </div>
              <div className="text-xs text-gray-500">
                Tap to view details
              </div>
            </div>

            {/* RIGHT */}
            <div className="text-right flex items-center gap-4">
              <div className="text-red-500 font-semibold text-lg">
                {Number(d.remaining_amount).toFixed(0)} Tk
              </div>

              {/* REPAY BUTTON */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // 🔥 prevent navigation
                  handleRepay(d.name);
                }}
                className="px-3 py-1 rounded bg-green-500 text-black text-sm"
              >
                Repay
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* EMPTY STATE */}
      {debts.length === 0 && (
        <div className="text-center text-gray-400 mt-10">
          No debts yet
        </div>
      )}
    </DashboardLayout>
  );
}
