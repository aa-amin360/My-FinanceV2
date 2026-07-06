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
      <div className="w-full space-y-6 animate-fadeIn pb-16">
        
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">Receivables</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-500">Track and manage outstanding funds owed to you by others.</p>
        </div>

        {/* LIST */}
        <div className="flex flex-col gap-4">
          {data.map((r) => (
            // ✅ Updated card to standard translucent glassmorphic panel
            <div
              key={r.entity_id}
              className="
                bg-white/45 dark:bg-black/35
                border border-black/[0.05] dark:border-white/[0.04]
                backdrop-blur-md p-5 rounded-3xl
                shadow-sm shadow-black/[0.01]
                flex justify-between items-center
                hover:bg-white/60 dark:hover:bg-black/45
                hover:scale-[1.01] transition-all duration-200
                cursor-pointer
              "
              onClick={() => router.push(`/receivables/${r.entity_id}`)}
            >
              {/* LEFT */}
              <div>
                <div className="font-bold text-lg text-black dark:text-white">
                  {formatName(r.name)}
                </div>
                <div className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                  Tap to view details
                </div>
              </div>

              {/* RIGHT */}
              <div className="text-right flex items-center gap-4">
                {/* ✅ Updated text color to premium Amber Gold instead of neon yellow */}
                <div className="text-amber-600 dark:text-amber-400 font-extrabold text-lg sm:text-xl">
                  {Number(r.remaining_amount).toLocaleString("en-BD")} Tk
                </div>

                {/* RECEIVE BUTTON */}
                {/* ✅ Updated to compact, highly professional Sapphire Indigo style */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card details navigation
                    handleReceive(r.name);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold text-xs sm:text-sm active:scale-95 transition"
                >
                  Receive
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* EMPTY STATE */}
        {data.length === 0 && (
          <div className="text-center text-slate-400 dark:text-zinc-500 py-12 text-sm">
            No active receivables on your ledger.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}