"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/frontend/components/templates/DashboardLayout";
import ObligationCard from "@/frontend/components/molecules/ObligationCard";
import PageHeader from "@/frontend/components/molecules/PageHeader";
import { useRefresh } from "@/frontend/hooks/useRefresh";
import { obligationsApi } from "@/frontend/api/obligations";
import { OBLIGATION_CONFIG, ObligationKind, openSettleModal } from "@/frontend/lib/obligationConfig";
import type { ObligationRow } from "@/shared/apiTypes";

// Everyone the user owes (debts) or who owes the user (receivables)
export default function ObligationListScreen({ kind }: { kind: ObligationKind }) {
  const config = OBLIGATION_CONFIG[kind];
  const [rows, setRows] = useState<ObligationRow[]>([]);
  const router = useRouter();

  const loadData = () => {
    obligationsApi
      .details(config.resource)
      .then(setRows)
      .catch((err) => console.error(`Failed to load ${config.title.toLowerCase()}:`, err));
  };

  useRefresh(loadData);

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 animate-fadeIn pb-16">
        <PageHeader title={config.title} subtitle={config.subtitle} />

        <div className="flex flex-col gap-4">
          {rows.map((row) => (
            <ObligationCard
              key={row.entity_id}
              row={row}
              config={config}
              onOpen={() => router.push(`${config.basePath}/${row.entity_id}`)}
              onSettle={() => openSettleModal(config, row.name)}
            />
          ))}
        </div>

        {rows.length === 0 && <div className="text-center text-slate-400 dark:text-zinc-500 py-12 text-sm">{config.emptyText}</div>}
      </div>
    </DashboardLayout>
  );
}
