"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Trash2, Pencil } from "lucide-react";
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
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
  // FAB LISTENER
  // =========================
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail === "TRANSACTION") {
        const type = prompt("Enter type (INCOME / EXPENSE)");
        const amount = prompt("Enter amount");

        if (!type || !amount) return;

        fetch("/api/transactions", {
          method: "POST",
          body: JSON.stringify({
            type: type.toUpperCase(),
            amount: Number(amount),
            account: "Cash",
            date: new Date().toISOString(),
            note: "Quick Transaction",
          }),
        }).then(() => loadData());
      }
    };

    window.addEventListener("openAdd", handler);
    return () => window.removeEventListener("openAdd", handler);
  }, []);

  
  // =========================
  // NAME RESOLVER (CORE FIX)
  // =========================
  const formatName = (name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
  // Priority:
  // 1. Entity (Debt / Receivable)
  // 2. Note (Expense / Income source)
  // 3. Category fallback
  // 4. Type fallback
    
  const getDisplayName = (t: Transaction) => {
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
      alert(data.error);
      return;
    }
  
    loadData();
  };

  const handleDeleteAll = async () => {
    const confirmDelete = confirm("Delete all transactions?");
    if (!confirmDelete) return;
  
    try {
      const res = await fetch("/api/transactions/all", {
        method: "DELETE",
      });
  
      if (res.ok) {
        window.dispatchEvent(new Event("refreshData"));
      } else {
        alert("Failed to delete transactions");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting transactions");
    }
  };
  
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
      
        <button
          onClick={handleDeleteAll}
          className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm hover:bg-red-700 active:scale-95 transition"
        >
          Delete All
        </button>
      </div>

      <div className="bg-gray-100 dark:bg-slate-900 rounded-2xl overflow-hidden">

        {/* HEADER */}
        <div className="grid grid-cols-5 px-4 py-3 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-slate-800">
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
                      {transactions.map((t) => {
              const amount = Number(t.amount);
    
              const isPositive =
                t.type === "INCOME" ||
                t.type === "DEBT_TAKEN" ||
                t.type === "RECEIVABLE_RECEIVED";
    
              return (
                <div
                  key={t.id}
                  className="grid grid-cols-[1.2fr_1fr_1fr_1fr_0.8fr] px-4 py-3 border-b border-gray-200 dark:border-slate-800 hover:bg-gray-200 dark:hover:bg-slate-800 transition"
                >
                  {/* NAME */}
                  <div className="font-semibold text-gray-900 dark:text-white text-base">
                    {getDisplayName(t)}
                  </div>
                
                  {/* DATE */}
                  <div className="text-xs text-gray-500">
                    {new Date(t.date).toDateString()}
                  </div>
                
                  {/* TYPE */}
                  <div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs inline-block whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px] ${getTypeStyle(t.type)}`}
                      title={formatType(t.type)} // optional: shows full text on hover
                    >
                      {formatType(t.type)}
                    </span>
                  </div>
                
                  {/* AMOUNT */}
                  <div
                    className={`text-right font-semibold ${
                      t.type === "INCOME" ||
                      t.type === "DEBT_TAKEN" ||
                      t.type === "RECEIVABLE_RECEIVED"
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {(t.type === "INCOME" ||
                      t.type === "DEBT_TAKEN" ||
                      t.type === "RECEIVABLE_RECEIVED"
                      ? "+"
                      : "-") +
                      Number(t.amount).toLocaleString("en-BD")}{" "}
                    Tk
                  </div>

                  {/* Actions */}
                  <div className="flex justify-center items-center gap-2">
  
                    {/* EDIT */}
                    <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-400 hover:text-white transition">
                      <Pencil size={16} />
                    </button>
                  
                    {/* DELETE */}
                    <button
                      onClick={() => setDeleteId(t.id)}
                      className="p-2 rounded-full hover:bg-red-500/20 text-red-400 hover:text-red-300 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* MOBILE CARD */}
          <div className="md:hidden space-y-3">
            {transactions.map((t) => {
              const amount = Number(t.amount);
          
              const isPositive =
                t.type === "INCOME" ||
                t.type === "DEBT_TAKEN" ||
                t.type === "RECEIVABLE_RECEIVED";
          
              return (
                <div
                  key={t.id}
                  className="bg-gray-100 dark:bg-slate-900 p-4 rounded-xl"
                >
                  {/* ROW 1 → NAME + AMOUNT + EDIT */}
                  <div className="flex justify-between items-center">
                    <div className="font-semibold text-base text-gray-900 dark:text-white">
                      {getDisplayName(t)}
                    </div>
          
                    <div className="flex items-center gap-2">
                      <div
                        className={`font-semibold text-sm ${
                          isPositive ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {isPositive ? "+" : "-"}
                        {Number(amount).toLocaleString("en-BD")} Tk
                      </div>
          
                      {/* EDIT */}
                      <button className="p-1 rounded-full text-gray-400 hover:text-white">
                        <Pencil size={14} />
                      </button>
                    </div>
                  </div>
          
                  {/* ROW 2 → DATE + TYPE + DELETE */}
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(t.date).toDateString().slice(4, 10)}
                    </div>
          
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          t.type.includes("INCOME")
                            ? "bg-green-500/20 text-green-400"
                            : t.type.includes("EXPENSE")
                            ? "bg-red-500/20 text-red-400"
                            : t.type.includes("DEBT")
                            ? "bg-blue-500/20 text-blue-400"
                            : t.type.includes("RECEIVABLE")
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {formatType(t.type)}
                      </span>
          
                      {/* DELETE */}
                      <button
                        onClick={() => setDeleteId(t.id)}
                        className="p-1 rounded-full text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
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
          
          <div className="bg-white/90 dark:bg-slate-900/80 border border-gray-200 dark:border-slate-700 
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
    </DashboardLayout>
  );
}
