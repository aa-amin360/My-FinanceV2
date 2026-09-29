"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/frontend/components/templates/DashboardLayout";
import AlertDialog from "@/frontend/components/molecules/AlertDialog";
import ConfirmDialog from "@/frontend/components/molecules/ConfirmDialog";
import TransactionFilters from "@/frontend/components/organisms/TransactionFilters";
import TransactionList from "@/frontend/components/organisms/TransactionList";
import { useRefresh } from "@/frontend/hooks/useRefresh";
import { errorMessage as describeError } from "@/frontend/api/client";
import { transactionsApi } from "@/frontend/api/transactions";
import { setOnboardingCached } from "@/frontend/lib/onboardingCache";
import type { Transaction } from "@/shared/apiTypes";
import { requestRefresh } from "@/frontend/lib/events";

export default function TransactionsScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Ignore responses from requests that were superseded while typing
  const requestId = useRef(0);

  const loadData = () => {
    const current = ++requestId.current;
    transactionsApi
      .list({ page, limit: 20, search, startDate, endDate })
      .then((result) => {
        if (current !== requestId.current) return;
        setTransactions(result.data);
        setTotalPages(result.pagination.totalPages);
      })
      .catch((err) => console.error("Failed to load transactions:", err));
  };

  useEffect(() => {
    const timer = setTimeout(loadData, search ? 250 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, startDate, endDate]);

  useRefresh(loadData, { runOnMount: false });

  // Any filter change starts again from the first page
  const updateFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      await transactionsApi.remove(id);
      requestRefresh();
    } catch (err) {
      setErrorMessage(describeError(err, "Cannot delete transaction"));
    } finally {
      setDeleteId(null);
      setLoading(false);
    }
  };

  // Resetting the ledger also removes opening balances, so the user goes
  // through onboarding again to set new ones
  const handleDeleteAll = async () => {
    setLoading(true);
    try {
      await transactionsApi.removeAll();
      setOnboardingCached(false);
      router.push("/onboarding");
    } catch (err) {
      setErrorMessage(describeError(err, "Failed to delete transactions"));
    } finally {
      setConfirmAll(false);
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6 px-1 animate-fadeIn">
        <h1 className="text-2xl font-bold">Transactions</h1>

        <button
          onClick={() => setConfirmAll(true)}
          className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm hover:bg-red-700 active:scale-95 transition"
        >
          Delete All
        </button>
      </div>

      <TransactionFilters
        search={search}
        startDate={startDate}
        endDate={endDate}
        onSearchChange={updateFilter(setSearch)}
        onStartDateChange={updateFilter(setStartDate)}
        onEndDateChange={updateFilter(setEndDate)}
        onReset={resetFilters}
      />

      <TransactionList
        transactions={transactions}
        page={page}
        totalPages={totalPages}
        loading={loading}
        onPageChange={setPage}
        onDelete={setDeleteId}
      />

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

      <ConfirmDialog
        isOpen={confirmAll}
        onClose={() => setConfirmAll(false)}
        onConfirm={handleDeleteAll}
        title="Delete All Transactions?"
        description="This permanently deletes every transaction, including opening balances, debts and receivables. Savings goals, budget plans and categories are kept. You will be asked to set your opening balances again. This cannot be undone."
        confirmText="Delete All"
        loading={loading}
        variant="danger"
      />

      <AlertDialog title="Action Not Allowed" message={errorMessage} onClose={() => setErrorMessage(null)} />
    </DashboardLayout>
  );
}
