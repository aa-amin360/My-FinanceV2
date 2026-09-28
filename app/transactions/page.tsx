"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/layout/DashboardLayout";
import GlassCalendar from "@/components/modal/GlassCalendar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  Trash2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  CornerDownRight,
  Search,
  RotateCcw
} from "lucide-react";
import { useRefresh } from "@/hooks/useRefresh";
import { formatMoney } from "@/lib/config";
import { formatName, formatTypeLabel, isInflowType } from "@/lib/ledger";
import { setOnboardingCached } from "@/lib/onboardingCache";

type Transaction = {
  id: number;
  type: string;
  amount: string;
  date: string;
  note: string | null;
  category_name?: string;
  entity_name?: string;
  parent_id?: number | null;
  has_child?: boolean;
  // A repayment the user recorded against an earlier debt/receivable (deletable)
  is_linked?: boolean;
};

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);

  // Pagination States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter States
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Ignore responses from requests that were superseded while typing
  const requestId = useRef(0);

  // Fetch dynamic transactions list based on pagination and filters
  const loadData = () => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    const current = ++requestId.current;
    fetch(`/api/transactions?${params.toString()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (current !== requestId.current) return;
        setTransactions(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
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

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getDisplayName = (t: Transaction) => {
    const isChild = !!t.parent_id;

    if (isChild && t.type === "RECEIVABLE_GIVEN") {
      return "Overpaid → now receivable";
    }

    if (isChild && t.type === "DEBT_TAKEN") {
      return "Over-collected → now debt";
    }

    if (t.entity_name) {
      return formatName(t.entity_name);
    }

    if (t.category_name) {
      return formatName(t.category_name);
    }

    return formatTypeLabel(t.type);
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "INCOME":
        return "bg-green-500/20 text-green-500";
      case "EXPENSE":
        return "bg-red-500/20 text-red-500";
      case "DEBT_TAKEN":
        return "bg-blue-500/20 text-blue-500";
      case "DEBT_REPAID":
        return "bg-cyan-500/20 text-cyan-500";
      case "RECEIVABLE_GIVEN":
        return "bg-yellow-500/20 text-yellow-500";
      case "RECEIVABLE_RECEIVED":
        return "bg-purple-500/20 text-purple-500";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      setDeleteId(null);

      if (!res.ok) {
        setErrorMessage(data.error || "Cannot delete transaction");
        return;
      }

      window.dispatchEvent(new Event("refreshData"));
    } catch (err) {
      console.error(err);
      setErrorMessage("Something went wrong during deletion.");
    } finally {
      setLoading(false);
    }
  };

  // Resetting the ledger also removes opening balances, so the user goes
  // through onboarding again to set new ones
  const handleDeleteAll = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions/all", {
        method: "DELETE",
      });

      setConfirmAll(false);
      if (res.ok) {
        setOnboardingCached(false);
        router.push("/onboarding");
      } else {
        setErrorMessage("Failed to delete transactions");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Error deleting transactions");
      setConfirmAll(false);
    } finally {
      setLoading(false);
    }
  };

  // The API returns top-level rows in display order followed by their children
  const roots = transactions.filter((t) => !t.parent_id);
  const childrenOf = (id: number) => transactions.filter((c) => c.parent_id === id);

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

      {/* Filters Bar */}
      <div className="grid grid-cols-12 gap-2 sm:gap-3 mb-6 animate-fadeIn items-center">
        
        <div className="relative col-span-10 md:col-span-5 group order-1">
          <Search 
            size={18} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none z-20" 
          />
          <input 
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => updateFilter(setSearch)(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm transition-all h-[46px] relative z-10"
          />
        </div>

        <button 
          onClick={() => { setSearch(""); setStartDate(""); setEndDate(""); setPage(1); }}
          title="Reset Filters"
          className="col-span-2 md:col-span-2 h-[46px] flex items-center justify-center gap-2 rounded-2xl bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-95 order-2 md:order-3"
        >
          <RotateCcw size={18} />
          <span className="hidden lg:inline text-xs font-bold uppercase tracking-wider">Reset</span>
        </button>

        <div className="col-span-12 md:col-span-5 grid grid-cols-2 gap-2 order-3 md:order-2">
          <GlassCalendar 
            value={startDate} 
            onChange={updateFilter(setStartDate)} 
            placeholder="Start Date" 
          />
          <GlassCalendar 
            value={endDate} 
            onChange={updateFilter(setEndDate)} 
            placeholder="End Date" 
          />
        </div>

      </div>

      {/* Main List Layout Container */}
      <div className="bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md rounded-3xl overflow-hidden shadow-sm shadow-black/[0.01]">

        {/* Desktop Table Headers */}
        <div className="hidden md:grid grid-cols-6 px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b border-black/[0.05] dark:border-white/[0.04] leading-none">
          <div>Name</div>
          <div>Date</div>
          <div>Type</div>
          <div>Note</div>
          <div className="text-right">Amount</div>
          <div className="text-center">Actions</div>
        </div>

        <div className="pb-24 md:pb-0">
          {/* Desktop Rows Render Block */}
          <div className="hidden md:block divide-y divide-slate-100 dark:divide-zinc-900/60">
            {roots.map((parent) => {
              const children = childrenOf(parent.id);
        
              const isExpanded = expanded[parent.id];
        
              const isPositive = isInflowType(parent.type);
        
              const finalAmount = Number(parent.amount);
            
              return (
                <div key={parent.id}>
                  <div
                    className="
                    grid grid-cols-6 items-center
                    px-5 py-4
                    border-b border-black/[0.04] dark:border-white/[0.04]
                    text-sm
                    hover:bg-white/35 dark:hover:bg-black/35
                    transition-all duration-200
                    "
                  >
        
                    <div className="font-semibold text-black dark:text-white text-base flex items-center">
                      {parent.has_child && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(parent.id);
                          }}
                          className="mr-2 cursor-pointer text-gray-400 dark:text-zinc-500"
                        >
                          {isExpanded ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </span>
                      )}
        
                      <span>{getDisplayName(parent)}</span>
                    </div>
        
                    <div className="text-xs text-gray-500 dark:text-zinc-500">
                      {new Date(parent.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        timeZone: "UTC",
                      })}
                    </div>
        
                    <div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${getTypeStyle(
                          parent.type
                        )}`}
                      >
                        {formatTypeLabel(parent.type)}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-zinc-500 truncate">
                      {parent.note || "—"}
                    </div>                    
        
                    <div
                      className={`text-right font-semibold ${
                        isPositive ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {(isPositive ? "+" : "-") + formatMoney(finalAmount)}
                    </div>
        
                    <div className="flex justify-center items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(parent.id);
                        }}
                        className="p-1.5 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
            
                  {/* Nested Children Rendering Block */}
                  {isExpanded &&
                    children.map((child) => {
                      const isPositiveChild = isInflowType(child.type);
        
                      return (
                        <div
                          key={child.id}
                          className="
                          grid grid-cols-6 items-center
                          px-5 py-3 pl-10
                          border-b border-black/[0.03] dark:border-white/[0.03]
                          text-sm
                          text-gray-500 dark:text-zinc-400
                          bg-white/20 dark:bg-black/20
                          backdrop-blur-sm
                          "
                        >
                          <div className="flex items-center gap-2">
                            <CornerDownRight
                              size={14}
                              className="text-gray-400 dark:text-zinc-500"
                            />
                            <span>{getDisplayName(child)}</span>
                          </div>
        
                          <div className="text-xs">
                            {new Date(child.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              timeZone: "UTC",
                            })}
                          </div>
        
                          <div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${getTypeStyle(
                                child.type
                              )}`}
                            >
                              {formatTypeLabel(child.type)}
                            </span>
                          </div>

                          <div className="text-xs truncate">
                            {child.note || "—"}
                          </div>                        
        
                          <div
                            className={`text-right font-semibold ${
                              isPositiveChild ? "text-emerald-500" : "text-rose-500"
                            }`}
                          >
                            {(isPositiveChild ? "+" : "-") + formatMoney(child.amount)}
                          </div>
        
                          <div className="flex justify-center items-center">
                            {child.is_linked && (
                              <button
                                onClick={() => setDeleteId(child.id)}
                                title="Delete this repayment"
                                className="p-1.5 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        
          {/* Mobile Card Layout list */}
          <div className="md:hidden space-y-3 px-2 py-4">
            {roots.map((parent) => {
              const children = childrenOf(parent.id);
        
              const isExpanded = expanded[parent.id];
        
              const isPositive = isInflowType(parent.type);
        
              const finalAmount = Number(parent.amount);
            
              return (
                <div key={parent.id} className="space-y-2">
        
                  {/* Parent Card (NESTING OVERLAY SOLVED: we use ultra-light transparency border to blend perfectly) */}
                  <div
                    className="
                    bg-white/10 dark:bg-white/[0.01]
                    border border-black/[0.04] dark:border-white/[0.03]
                    p-4 rounded-2xl
                    shadow-sm shadow-black/[0.01]
                    "
                  >
                    <div className="flex justify-between gap-3">
                    
                      <div className="flex-1 min-w-0 space-y-3">
                    
                        <div className="flex items-center gap-2">
                    
                          {parent.has_child && (
                            <button
                              onClick={() => toggleExpand(parent.id)}
                              className="
                              w-6 h-6 rounded-full
                              bg-black/[0.03] dark:bg-white/[0.03]
                              border border-black/[0.04] dark:border-white/[0.04]
                              flex items-center justify-center
                              text-gray-500 dark:text-zinc-400
                              shrink-0
                              "
                            >
                              {isExpanded ? (
                                <ChevronDown size={14} />
                              ) : (
                                <ChevronRight size={14} />
                              )}
                            </button>
                          )}
                    
                          <div className="font-bold text-black dark:text-white truncate">
                            {getDisplayName(parent)}
                          </div>
                        </div>
                    
                        <div className="flex items-center justify-between gap-3">
                    
                          <div className="text-xs text-gray-500 dark:text-zinc-500">
                            {new Date(parent.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              timeZone: "UTC",
                            })}
                          </div>
                    
                          <div
                            className={`font-semibold whitespace-nowrap ${
                              isPositive ? "text-emerald-500" : "text-rose-500"
                            }`}
                          >
                            {isPositive ? "+" : "-"}
                            {formatMoney(finalAmount)}
                          </div>
                        </div>
                    
                        <div className="flex items-center justify-between gap-3">
                    
                          <div className="text-xs text-gray-500 dark:text-zinc-500 truncate">
                            {parent.note || "No note"}
                          </div>
                    
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase shrink-0 ${getTypeStyle(
                              parent.type
                            )}`}
                          >
                            {formatTypeLabel(parent.type)}
                          </span>
                        </div>
                      </div>
                    
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(parent.id);
                        }}
                        className="
                        w-10 h-10 rounded-full
                        bg-black/[0.03] dark:bg-white/[0.03]
                        flex items-center justify-center
                        text-red-400
                        shrink-0 self-center
                        "
                      >
                        <Trash2 size={16} />
                      </button>
                    
                    </div>
                  </div>
            
                  {/* Nested mobile child cards */}
                  {isExpanded &&
                    children.map((child) => {
                      const isPositiveChild = isInflowType(child.type);
        
                      return (
                        <div
                          key={child.id}
                          className="
                          bg-white/5 dark:bg-white/[0.01]
                          border border-black/[0.03] dark:border-white/[0.02]
                          p-3 rounded-xl
                          ml-4
                          text-gray-500 dark:text-zinc-400
                          "
                        >
                          <div className="space-y-2">
                          
                            <div className="flex items-center gap-2">
                              <CornerDownRight
                                size={14}
                                className="text-gray-400 dark:text-zinc-500 shrink-0"
                              />
                          
                              <span className="text-black dark:text-white truncate font-bold text-xs sm:text-sm">
                                {getDisplayName(child)}
                              </span>
                            </div>
                          
                            <div className="flex items-center justify-between gap-3">
                          
                              <div className="text-xs text-gray-500 dark:text-zinc-500">
                                {new Date(child.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  timeZone: "UTC",
                                })}
                              </div>
                          
                              <span
                                className={`font-semibold whitespace-nowrap text-xs sm:text-sm ${
                                  isPositiveChild
                                    ? "text-emerald-500"
                                    : "text-rose-500"
                                }`}
                              >
                                {isPositiveChild ? "+" : "-"}
                                {formatMoney(child.amount)}
                                {child.is_linked && (
                                  <button
                                    onClick={() => setDeleteId(child.id)}
                                    title="Delete this repayment"
                                    className="ml-2 align-middle text-red-400"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </span>
                            </div>
                          
                            <div className="flex items-center justify-between gap-3">
                          
                              <div className="text-xs text-gray-500 dark:text-zinc-500 truncate">
                                {child.note || "No note"}
                              </div>
                          
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase shrink-0 ${getTypeStyle(
                                  child.type
                                )}`}
                              >
                                {formatTypeLabel(child.type)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>

          {/* Pagination controls wrapper */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/[0.05] dark:border-white/[0.04]">
              <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                Page {page} of {totalPages}
              </div>

              <div className="flex gap-2">
                <button
                  disabled={page === 1 || loading}
                  onClick={() => {
                    setPage(page - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition"
                >
                  <ChevronLeft size={18} />
                </button>

                <button
                  disabled={page === totalPages || loading}
                  onClick={() => {
                    setPage(page + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Empty State */}
        {transactions.length === 0 && (
          <div className="p-6 text-center text-gray-400">
            No transactions yet
          </div>
        )}
      </div>

      {/* 1. Single Delete Confirmation Modal */}
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

      {/* 2. Delete All Confirmation Modal */}
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

      {/* 3. Action Warning Dialog */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setErrorMessage(null)}>
          <div className="bg-white/75 dark:bg-black/60 border border-black/[0.05] dark:border-white/[0.05] text-black dark:text-white backdrop-blur-xl rounded-3xl p-6 w-full max-w-[320px] text-center shadow-2xl flex flex-col gap-4 animate-modalIn" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-3 text-red-400">
              Action Not Allowed
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
              {errorMessage}
            </p>
            <button
              onClick={() => setErrorMessage(null)}
              className="px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-sm transition active:scale-95 shadow-md shadow-green-500/10"
            >
              OK
            </button>
          </div>
        </div>
      )}      
    </DashboardLayout>
  );
}