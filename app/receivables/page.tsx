"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useRefresh } from "@/hooks/useRefresh";

type Receivable = {
  entity_id: string;
  name: string;
  total_amount: string;
  remaining_amount: string;
};

export default function ReceivablePage() {
  const [data, setData] = useState<Receivable[]>([]);
  const router = useRouter();

  // =========================
  // LOAD DATA
  // =========================
  const loadData = () => {
    fetch("/api/receivables/details", { cache: "no-store" })
      .then((res) => res.json())
      .then((d) => setData(d.data || []));
  };

  useRefresh(loadData);

  // =========================
  // FORMAT NAME
  // =========================
  const formatName = (text: string) => {
    return text
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // =========================
  // RECEIVE ACTION
  // =========================
  const handleReceive = (entityName: string) => {
    window.dispatchEvent(
      new CustomEvent("openAdd", {
        detail: {
          type: "RECEIVABLE_RECEIVED",
          entity: entityName,
        },
      })
    );
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Receivables</h1>

      <div className="flex flex-col gap-4">
        {data.map((r) => (
          <div
            key={r.entity_id}
            className="bg-gray-100 dark:bg-zinc-950 border border-zinc-900 p-5 rounded-2xl flex justify-between items-center hover:bg-gray-200 dark:hover:bg-zinc-900 transition cursor-pointer"
            onClick={() => router.push(`/receivables/${r.entity_id}`)}
          >
            {/* LEFT */}
            <div>
              <div className="font-semibold text-lg">
                {formatName(r.name)}
              </div>
              <div className="text-xs text-zinc-500>
                Tap to view details
              </div>
            </div>

            {/* RIGHT */}
            <div className="text-right flex items-center gap-4">
              <div className="text-yellow-500 font-semibold text-lg">
                {Number(r.remaining_amount).toFixed(0)} Tk
              </div>

              {/* RECEIVE BUTTON */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // prevent navigation
                  handleReceive(r.name);
                }}
                className="px-3 py-1 rounded bg-blue-500 text-black text-sm"
              >
                Receive
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* EMPTY STATE */}
      {data.length === 0 && (
        <div className="text-center text-gray-400 mt-10">
          No receivables yet
        </div>
      )}
    </DashboardLayout>
  );
}
