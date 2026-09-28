"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useRefresh } from "@/hooks/useRefresh";
import { formatMoney } from "@/lib/config";
import { formatName } from "@/lib/ledger";
import { OBLIGATION_CONFIG, ObligationKind, ObligationRow, openSettleModal } from "./config";

export default function ObligationListPage({ kind }: { kind: ObligationKind }) {
  const config = OBLIGATION_CONFIG[kind];
  const [rows, setRows] = useState<ObligationRow[]>([]);
  const router = useRouter();

  const loadData = () => {
    fetch(config.apiPath, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setRows(data.data || []))
      .catch((err) => console.error(`Failed to load ${config.title.toLowerCase()}:`, err));
  };

  useRefresh(loadData);

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 animate-fadeIn pb-16">

        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">{config.title}</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-500">{config.subtitle}</p>
        </div>

        {/* LIST */}
        <div className="flex flex-col gap-4">
          {rows.map((row) => (
            <div
              key={row.entity_id}
              onClick={() => router.push(`${config.basePath}/${row.entity_id}`)}
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
            >
              {/* LEFT */}
              <div>
                <div className="font-bold text-lg text-black dark:text-white">
                  {formatName(row.name)}
                </div>
                <div className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                  Tap to view details
                </div>
              </div>

              {/* RIGHT */}
              <div className="text-right flex items-center gap-4">
                <div className={`${config.amountClass} font-extrabold text-lg sm:text-xl`}>
                  {formatMoney(row.remaining_amount)}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card details navigation
                    openSettleModal(config, row.name);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm active:scale-95 transition ${config.actionClass}`}
                >
                  {config.actionLabel}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* EMPTY STATE */}
        {rows.length === 0 && (
          <div className="text-center text-slate-400 dark:text-zinc-500 py-12 text-sm">
            {config.emptyText}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
