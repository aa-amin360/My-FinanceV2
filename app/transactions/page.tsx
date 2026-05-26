"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  Trash2,
  ChevronRight,
  ChevronDown,
  CornerDownRight,
} from "lucide-react";
import { useRefresh } from "@/hooks/useRefresh";

const formatType = (type: string) =>
  type
    .toLowerCase()
    .replace("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

type Transaction = {
  id: string;
  type: string;
  amount: string;
  date: string;
  note: string | null;
  category_name?: string;
  entity_name?: string;

  parent_id?: string | null;
  has_child?: boolean;  
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // =========================
  // LOAD DATA
  // =========================
  const loadData = () => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => setTransactions(data.data || []));
  };

  useRefresh(loadData);
  
  // =========================
  // NAME RESOLVER (CORE FIX)
  // =========================
  const formatName = (name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  
  const getDisplayName = (t: Transaction) => {
    const isChild = !!t.parent_id;
  
    // 🔥 DEBT OVERPAY → becomes receivable
    if (isChild && t.type === "RECEIVABLE_GIVEN") {
      return "Overpaid → now receivable";
    }
  
    // 🔥 RECEIVABLE OVER-COLLECT → becomes debt
    if (isChild && t.type === "DEBT_TAKEN") {
      return "Over-collected → now debt";
    }
  
    if (t.entity_name) return formatName(t.entity_name);
  
    if (t.note) return formatName(t.note);
  
    if (t.category_name) return formatName(t.category_name);
  
    return formatType(t.type);
  };

  // =========================
  // CATEGORY RESOLVER
  // =========================
  const getCategory = (t: Transaction) => {
    if (t.category_name) return t.category_name;

    // fallback to readable type
    return formatType(t.type);
  };

  // =========================
  // TYPE STYLE
  // =========================
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
  
  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/transactions/${id}`, {
      method: "DELETE",
    });
  
    const data = await res.json();
  
    if (!res.ok) {
      setDeleteId(null);
      setErrorMessage(data.error || "Cannot delete transaction");
      return;
    }
  
    loadData();
  };

  const handleDeleteAll = async () => {
    try {
      const res = await fetch("/api/transactions/all", {
        method: "DELETE",
      });
  
      if (res.ok) {
        window.dispatchEvent(new Event("refreshData"));
        setConfirmAll(false);
      } else {
        setErrorMessage("Failed to delete transactions");
        setConfirmAll(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Error deleting transactions");
      setConfirmAll(false);
    }
  };

  // =========================
  // SORT (Parent → Child)
  // =========================
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
  
    // Parent comes before child
    if (a.id === b.parent_id) return -1;
    if (b.id === a.parent_id) return 1;
  
    return 0;
  });

  const roots = sortedTransactions.filter((t) => !t.parent_id);

  const getChildren = (id: string) =>
    transactions.filter((t) => t.parent_id === id);
  
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
      
        <button
          onClick={() => setConfirmAll(true)}
          className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm hover:bg-red-700 active:scale-95 transition"
        >
          Delete All
        </button>
      </div>      

      <div className="bg-white dark:bg-black border border-gray-200 dark:border-zinc-900 rounded-3xl overflow-hidden">

        {/* HEADER */}
        <div className="grid grid-cols-5 px-4 py-4 text-xs uppercase tracking-wider text-gray-500 dark:text-zinc-500 border-b border-gray-200 dark:border-zinc-900">
          <div>Name</div>
          <div>Date</div>
          <div>Type</div>
          <div className="text-right">Amount</div>
          <div className="text-center">Actions</div>
        </div>

        <div className="pb-24 md:pb-0">
          {/* ROWS */}
          {/* DESKTOP TABLE */}
          <div className="hidden md:block">
            {roots.map((parent) => {
              const children = sortedTransactions.filter(
                (c) => c.parent_id === parent.id
              );
        
              const isExpanded = expanded[parent.id];
        
              const isPositive =
                parent.type === "INCOME" ||
                parent.type === "DEBT_TAKEN" ||
                parent.type === "RECEIVABLE_RECEIVED";
        
              const finalAmount = Number(parent.amount);
        
              return (
                <div key={parent.id}>
                  {/* ================= PARENT ================= */}
                  <div
                    className="
                    grid grid-cols-5 items-center
                    px-4 py-4
                    border-b border-gray-200 dark:border-zinc-900
                    text-sm
                    hover:bg-gray-100 dark:hover:bg-zinc-950/60
                    transition-all duration-200
                    "
                  >
        
                    {/* NAME */}
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
        
                    {/* DATE */}
                    <div className="text-xs text-gray-500 dark:text-zinc-500">
                      {new Date(parent.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        timeZone: "UTC",
                      })}
                    </div>
        
                    {/* TYPE */}
                    <div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getTypeStyle(
                          parent.type
                        )}`}
                      >
                        {formatType(parent.type)}
                      </span>
                    </div>
        
                    {/* AMOUNT */}
                    <div
                      className={`text-right font-semibold ${
                        isPositive ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {(isPositive ? "+" : "-") +
                        finalAmount.toLocaleString("en-BD")}{" "}
                      Tk
                    </div>
        
                    {/* ACTIONS */}
                    <div className="flex justify-center items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(parent.id);
                        }}
                        className="
                        p-2 rounded-full
                        hover:bg-red-500/20
                        text-red-400 hover:text-red-300
                        transition
                        "
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
        
                  {/* ================= CHILDREN ================= */}
                  {isExpanded &&
                    children.map((child) => {
                      const isPositiveChild =
                        child.type === "INCOME" ||
                        child.type === "DEBT_TAKEN" ||
                        child.type === "RECEIVABLE_RECEIVED";
        
                      return (
                        <div
                          key={child.id}
                          className="
                          grid grid-cols-5 items-center
                          px-4 py-3 pl-10
                          border-b border-gray-200 dark:border-zinc-900
                          text-sm
                          text-gray-500 dark:text-zinc-500
                          bg-gray-50 dark:bg-zinc-950/30
                          "
                        >
                          {/* NAME */}
                          <div className="flex items-center gap-2">
                            <CornerDownRight
                              size={14}
                              className="text-gray-400 dark:text-zinc-500"
                            />
                            <span>{getDisplayName(child)}</span>
                          </div>
        
                          {/* DATE */}
                          <div className="text-xs">
                            {new Date(child.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              timeZone: "UTC",
                            })}
                          </div>
        
                          {/* TYPE */}
                          <div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${getTypeStyle(
                                child.type
                              )}`}
                            >
                              {formatType(child.type)}
                            </span>
                          </div>
        
                          {/* AMOUNT */}
                          <div
                            className={`text-right font-semibold ${
                              isPositiveChild ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {(isPositiveChild ? "+" : "-") +
                              Number(child.amount).toLocaleString("en-BD")}{" "}
                            Tk
                          </div>
        
                          <div />
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        
          {/* MOBILE CARD */}
          <div className="md:hidden space-y-3">
            {roots.map((parent) => {
              const children = sortedTransactions.filter(
                (c) => c.parent_id === parent.id
              );
        
              const isExpanded = expanded[parent.id];
        
              const isPositive =
                parent.type === "INCOME" ||
                parent.type === "DEBT_TAKEN" ||
                parent.type === "RECEIVABLE_RECEIVED";
        
              const finalAmount = Number(parent.amount);
        
              return (
                <div key={parent.id} className="space-y-2">
        
                  {/* ===== PARENT CARD ===== */}
                  <div
                    className="
                    bg-white dark:bg-zinc-950
                    border border-gray-200 dark:border-zinc-900
                    p-4 rounded-2xl
                    "
                  >
                    <div className="flex justify-between items-start">
        
                      {/* LEFT */}
                      <div className="flex items-start gap-2">
        
                        {parent.has_child && (
                          <button
                            onClick={() => toggleExpand(parent.id)}
                            className="
                            mt-0.5
                            w-6 h-6
                            rounded-full
                            bg-gray-100 dark:bg-zinc-900
                            flex items-center justify-center
                            text-gray-500 dark:text-zinc-400
                            "
                          >
                            {isExpanded ? (
                              <ChevronDown size={14} />
                            ) : (
                              <ChevronRight size={14} />
                            )}
                          </button>
                        )}
        
                        <div>
                          <div className="font-semibold text-black dark:text-white">
                            {getDisplayName(parent)}
                          </div>
        
                          <div className="mt-1 text-xs text-gray-500 dark:text-zinc-500">
                            {new Date(parent.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              timeZone: "UTC",
                            })}
                          </div>
                        </div>
                      </div>
        
                      {/* RIGHT */}
                      <div className="flex flex-col items-end gap-2">
        
                        <div
                          className={`font-semibold ${
                            isPositive ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {isPositive ? "+" : "-"}
                          {finalAmount.toLocaleString("en-BD")} Tk
                        </div>
        
                        <div className="flex items-center gap-2">
        
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getTypeStyle(
                              parent.type
                            )}`}
                          >
                            {formatType(parent.type)}
                          </span>
        
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(parent.id);
                            }}
                            className="
                            w-8 h-8 rounded-full
                            bg-gray-100 dark:bg-zinc-900
                            flex items-center justify-center
                            text-red-400
                            "
                          >
                            <Trash2 size={14} />
                          </button>
        
                        </div>
                      </div>
                    </div>
                  </div>
        
                  {/* ===== CHILDREN ===== */}
                  {isExpanded &&
                    children.map((child) => {
                      const isPositiveChild =
                        child.type === "INCOME" ||
                        child.type === "DEBT_TAKEN" ||
                        child.type === "RECEIVABLE_RECEIVED";
        
                      return (
                        <div
                          key={child.id}
                          className="
                          bg-gray-50 dark:bg-zinc-950/60
                          border border-gray-200 dark:border-zinc-900
                          p-3 rounded-xl
                          ml-4
                          text-gray-500 dark:text-zinc-500
                          "
                        >
                          <div className="flex justify-between">
                            <div className="flex items-center gap-2">
                              <CornerDownRight size={14} />
                              <span>{getDisplayName(child)}</span>
                            </div>
        
                            <span
                              className={`${
                                isPositiveChild
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {isPositiveChild ? "+" : "-"}
                              {Number(child.amount).toLocaleString("en-BD")} Tk
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* EMPTY */}
        {transactions.length === 0 && (
          <div className="p-6 text-center text-gray-400">
            No transactions yet
          </div>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          
          <div className="bg-white/90 dark:bg-black/80 border border-gray-200 dark:border-slate-700 
            text-black dark:text-white backdrop-blur-xl rounded-2xl p-6 w-[320px] text-center shadow-2xl">
            
            <h3 className="text-lg font-semibold mb-5">
              Delete this transaction?
            </h3>
      
            <div className="flex gap-3 justify-center">
              
              <button
                onClick={async () => {
                  await handleDelete(deleteId);
                  setDeleteId(null);
                }}
                className="px-5 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
              >
                Delete
              </button>
      
              <button
                onClick={() => setDeleteId(null)}
                className="px-5 py-2 rounded-full bg-gray-200 dark:bg-slate-700 text-black dark:text-gray-300 hover:bg-slate-600 transition"
              >
                Cancel
              </button>
      
            </div>
      
          </div>
      
        </div>
      )}

      {confirmAll && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          
          <div className="bg-white/90 dark:bg-black/80 border border-gray-200 dark:border-slate-700 
            text-black dark:text-white backdrop-blur-xl rounded-2xl p-6 w-[320px] text-center shadow-2xl">
            
            <h3 className="text-lg font-semibold mb-4 text-red-400">
              Delete All Transactions?
            </h3>
      
            <p className="text-sm text-gray-500 mb-5">
              This will remove all transaction records permanently.
            </p>
      
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleDeleteAll}
                className="px-5 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
              >
                Delete All
              </button>
      
              <button
                onClick={() => setConfirmAll(false)}
                className="px-5 py-2 rounded-full bg-gray-200 dark:bg-slate-700 text-black dark:text-gray-300 hover:bg-slate-600 transition"
              >
                Cancel
              </button>
            </div>
      
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          
          <div className="bg-white/90 dark:bg-black/80 border border-gray-200 dark:border-slate-700 
            text-black dark:text-white backdrop-blur-xl rounded-2xl p-6 w-[320px] text-center shadow-2xl">
            
            <h3 className="text-lg font-semibold mb-3 text-red-400">
              Action Not Allowed
            </h3>
      
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
              {errorMessage}
            </p>
      
            <button
              onClick={() => setErrorMessage(null)}
              className="px-5 py-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition"
            >
              OK
            </button>
      
          </div>
        </div>
      )}      
      
    </DashboardLayout>
  );
}
