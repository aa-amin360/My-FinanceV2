"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/frontend/components/templates/DashboardLayout";
import BackButton from "@/frontend/components/atoms/BackButton";
import Heading from "@/frontend/components/atoms/Heading";
import LedgerEntryItem from "@/frontend/components/molecules/LedgerEntryItem";
import ObligationSummary from "@/frontend/components/organisms/ObligationSummary";
import { useRefresh } from "@/frontend/hooks/useRefresh";
import { obligationsApi } from "@/frontend/api/obligations";
import { transactionsApi } from "@/frontend/api/transactions";
import { OBLIGATION_CONFIG, ObligationKind, openSettleModal } from "@/frontend/lib/obligationConfig";
import { isLedgerRow } from "@/shared/ledger";
import { subtractMoney, sumMoney } from "@/shared/money";
import type { ObligationRow, Transaction } from "@/shared/apiTypes";

// History and totals for one counterparty
export default function ObligationDetailScreen({ kind }: { kind: ObligationKind }) {
  const config = OBLIGATION_CONFIG[kind];
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [name, setName] = useState("");
  const [outstanding, setOutstanding] = useState<ObligationRow | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadData = async () => {
    try {
      const [details, txPage] = await Promise.all([
        obligationsApi.details(config.resource),
        transactionsApi.list({ all: true, entityId: id }),
      ]);

      // Route params are strings while ids from the API are numbers
      const row = details.find((d) => String(d.entity_id) === String(id)) || null;
      const rows = txPage.data.filter(
        (t) => (t.type === config.originType || t.type === config.settleType) && isLedgerRow(t)
      );

      setOutstanding(row);
      setTransactions(rows);
      setName(row?.name || rows.find((t) => t.entity_name)?.entity_name || "");
    } catch (err) {
      console.error(`Failed to load ${config.detailTitle.toLowerCase()}:`, err);
    }
  };

  useRefresh(loadData);

  const totalOrigin = sumMoney(transactions.filter((t) => t.type === config.originType).map((t) => t.amount));
  const totalSettled = sumMoney(transactions.filter((t) => t.type === config.settleType).map((t) => t.amount));
  // The debts/receivables table is authoritative; it has no row once fully settled
  const remaining = outstanding ? Number(outstanding.remaining_amount) : Math.max(0, subtractMoney(totalOrigin, totalSettled));

  const newestFirst = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id - a.id
  );

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 animate-fadeIn pb-16">
        <div className="flex items-center gap-3">
          <BackButton onClick={() => router.push(config.basePath)} label={`Back to ${config.title.toLowerCase()}`} />
          <Heading>{config.detailTitle}</Heading>
        </div>

        <ObligationSummary
          config={config}
          name={name}
          totalOrigin={totalOrigin}
          totalSettled={totalSettled}
          remaining={remaining}
          onSettle={() => openSettleModal(config, name)}
        />

        <div className="flex flex-col gap-3">
          {newestFirst.map((t) => (
            <LedgerEntryItem key={t.id} transaction={t} />
          ))}
        </div>

        {transactions.length === 0 && <div className="text-center text-slate-400 dark:text-zinc-500 py-12 text-sm">No transactions found</div>}
      </div>
    </DashboardLayout>
  );
}
