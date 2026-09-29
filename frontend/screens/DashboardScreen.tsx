"use client";

import { useState } from "react";
import ConfirmDialog from "@/frontend/components/molecules/ConfirmDialog";
import MetricCard from "@/frontend/components/molecules/MetricCard";
import BalanceHero from "@/frontend/components/organisms/BalanceHero";
import BalanceTrajectoryCard from "@/frontend/components/organisms/BalanceTrajectoryCard";
import DueCommitmentsBanner from "@/frontend/components/organisms/DueCommitmentsBanner";
import RecentTransactions from "@/frontend/components/organisms/RecentTransactions";
import SavingsMonoliths from "@/frontend/components/organisms/SavingsMonoliths";
import SavingsVault from "@/frontend/components/organisms/SavingsVault";
import WeeklyChartCard from "@/frontend/components/organisms/WeeklyChartCard";
import { useRefresh } from "@/frontend/hooks/useRefresh";
import { balanceApi } from "@/frontend/api/balance";
import { errorMessage } from "@/frontend/api/client";
import { obligationsApi } from "@/frontend/api/obligations";
import { reportsApi } from "@/frontend/api/reports";
import { savingsApi } from "@/frontend/api/savings";
import { transactionsApi } from "@/frontend/api/transactions";
import { localDateString } from "@/shared/config";
import type { Balances, Report, SavingsGoal, Transaction } from "@/shared/apiTypes";
import { requestRefresh } from "@/frontend/lib/events";

const EMPTY_BALANCES: Balances = { balance: 0, cashBalance: 0, bankBalance: 0, savingsTotal: 0 };

export default function DashboardScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balances, setBalances] = useState<Balances>(EMPTY_BALANCES);
  const [debt, setDebt] = useState(0);
  const [receivable, setReceivable] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [trajectory, setTrajectory] = useState<Report["trajectory"]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load all dashboard metrics and the latest transactions in parallel
  const loadData = async () => {
    try {
      const [txPage, balanceData, debtTotal, receivableTotal, goalList, report] = await Promise.all([
        transactionsApi.list({ limit: 5 }),
        balanceApi.get(),
        obligationsApi.total("debts"),
        obligationsApi.total("receivables"),
        savingsApi.list(),
        reportsApi.get("ALL", localDateString()),
      ]);

      setTransactions(txPage.data);
      setBalances(balanceData);
      setDebt(debtTotal);
      setReceivable(receivableTotal);
      setGoals(goalList);
      setIncome(report.income);
      setExpense(report.expense);
      setTrajectory(report.trajectory);
    } catch (err) {
      console.error("Failed to load dashboard data in parallel:", err);
    }
  };

  useRefresh(loadData);

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      await transactionsApi.remove(id);
      setDeleteError(null);
      requestRefresh();
    } catch (err) {
      setDeleteError(errorMessage(err, "Could not delete this transaction."));
    } finally {
      setDeleteId(null);
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full space-y-6 pb-12">
        <DueCommitmentsBanner goals={goals} />

        <BalanceHero
          balance={balances.balance}
          cashBalance={balances.cashBalance}
          bankBalance={balances.bankBalance}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Income" value={income} type="income" />
          <MetricCard title="Expenses" value={expense} type="expense" />
          <MetricCard title="Debt" value={debt} type="debt" href="/debts" />
          <MetricCard title="Receivable" value={receivable} type="receivable" href="/receivables" />
        </div>

        <SavingsVault goals={goals} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <BalanceTrajectoryCard trajectory={trajectory} />
          <div className="lg:col-span-4">
            <SavingsMonoliths goals={goals} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <WeeklyChartCard />
        </div>

        <RecentTransactions transactions={transactions} error={deleteError} onDelete={setDeleteId} />
      </div>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Delete Transaction?"
        description="Are you sure you want to permanently delete this transaction? This action cannot be undone."
        confirmText="Delete"
        loading={loading}
        variant="danger"
      />
    </>
  );
}
