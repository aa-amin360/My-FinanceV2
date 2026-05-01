"use client";

import { useEffect, useState } from "react";

export default function TransactionModal() {
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<"ACTION" | "FORM">("ACTION");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [loading, setLoading] = useState(false);
  const [editTx, setEditTx] = useState<any | null>(null);

  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("Cash");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

  const [error, setError] = useState("");
  const [isDirectFlow, setIsDirectFlow] = useState(false);

  const isEdit = !!editTx;

  // ================= RESET =================
  const resetForm = () => {
    setAmount("");
    setCategory("");
    setEntity("");
    setNote("");
    setError("");
    setAction("");
    setAccount("Cash");
  };

  const closeModal = () => {
    setShowModal(false);
    setIsDirectFlow(false);
    setStep("ACTION");
    setEditTx(null);
    resetForm();
    window.dispatchEvent(new Event("refreshData"));
  };

  // ================= LOAD CATEGORIES =================
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.data || []));
  }, []);

  // ================= EVENT HANDLER =================
  useEffect(() => {
    const handler = (e: any) => {
      setShowModal(true);

      // CREATE FLOW
      if (typeof e.detail === "string") {
        setEditTx(null);

        if (e.detail === "DEBT") {
          setAction("BORROW");
          setStep("FORM");
          setIsDirectFlow(true);
        } else if (e.detail === "RECEIVABLE") {
          setAction("GIVE");
          setStep("FORM");
          setIsDirectFlow(true);
        } else {
          setStep("ACTION");
          setIsDirectFlow(false);
        }
      }

      // EDIT FLOW
      if (typeof e.detail === "object") {
        // 🔥 CASE 1: FULL TRANSACTION (edit)
        if (e.detail.data) {
          const t = e.detail.data;
      
          setEditTx(t);
          setStep("FORM");
      
          setAmount(String(t.amount || ""));
          setNote(t.note || "");
          setEntity(t.entity_name || "");
          setCategory(t.category_id || "");
      
          if (t.type === "INCOME") setAction("INCOME");
          if (t.type === "EXPENSE") setAction("EXPENSE");
          if (t.type === "DEBT_TAKEN") setAction("BORROW");
          if (t.type === "RECEIVABLE_GIVEN") setAction("GIVE");
          if (t.type === "DEBT_REPAID") setAction("REPAY");
          if (t.type === "RECEIVABLE_RECEIVED") setAction("RECEIVE");
        }
      
        // 🔥 CASE 2: DIRECT REPAY (from debt page)
        else if (e.detail.type === "DEBT_REPAID") {
          setEditTx(null);
          setAction("REPAY");
          setStep("FORM");
          setIsDirectFlow(true);
      
          // 🔥 THIS WAS MISSING
          setEntity(e.detail.entity || "");
        }
      
        // 🔥 CASE 3: DIRECT RECEIVE (future-proof)
        else if (e.detail.type === "RECEIVABLE_RECEIVED") {
          setEditTx(null);
          setAction("RECEIVE");
          setStep("FORM");
          setIsDirectFlow(true);
      
          setEntity(e.detail.entity || "");
        }
      }
    };

    window.addEventListener("openAdd", handler);
    return () => window.removeEventListener("openAdd", handler);
  }, []);

  // ================= TYPE MAP =================
  const actionToTypeMap: Record<string, string> = {
    INCOME: "INCOME",
    EXPENSE: "EXPENSE",
    BORROW: "DEBT_TAKEN",
    GIVE: "RECEIVABLE_GIVEN",
    REPAY: "DEBT_REPAID",
    RECEIVE: "RECEIVABLE_RECEIVED",
  };

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    if (loading) return;

    setError("");

    const amountNumber = Number(amount);

    if (!amount || amountNumber <= 0) {
      setError("Enter a valid amount");
      return;
    }

    if (!isEdit && (action === "INCOME" || action === "EXPENSE") && !category) {
      setError("Select a category");
      return;
    }

    if (
      ["BORROW", "GIVE", "REPAY", "RECEIVE"].includes(action) &&
      !entity
    ) {
      setError("Enter person / entity");
      return;
    }

    setLoading(true);

    try {
      const body: any = {
        type: actionToTypeMap[action],
        amount: amountNumber,
        account,
        date: isEdit ? editTx.date : new Date().toISOString(),
        note,
      };

      if (category) body.category_id = category;
      if (entity) body.entity = entity;
      if (isEdit) body.id = editTx.id;

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Transaction failed");
        return;
      }

      closeModal();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!showModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
      onClick={closeModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[340px] bg-white/90 dark:bg-slate-900/90 border border-gray-200 dark:border-slate-700 text-black dark:text-white rounded-2xl p-5 shadow-2xl flex flex-col gap-4 animate-modalIn"
      >
        {/* ================= ACTION ================= */}
        {step === "ACTION" && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Select Action
              </h3>

              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ActionCard label="Income" onClick={() => { setAction("INCOME"); setStep("FORM"); }} />
              <ActionCard label="Expense" onClick={() => { setAction("EXPENSE"); setStep("FORM"); }} />
              <ActionCard label="Borrow" onClick={() => { setAction("BORROW"); setStep("FORM"); }} />
              <ActionCard label="Give" onClick={() => { setAction("GIVE"); setStep("FORM"); }} />
            </div>

            <button
              onClick={closeModal}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition"
            >
              Cancel
            </button>
          </>
        )}

        {/* ================= FORM ================= */}
        {step === "FORM" && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {isEdit
                  ? "Edit Transaction"
                  : action === "INCOME"
                  ? "Add Income"
                  : action === "EXPENSE"
                  ? "Add Expense"
                  : action === "BORROW"
                  ? "Borrow Money"
                  : "Give Money"}
              </h3>

              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <input
              className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <select
              className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            >
              <option>Cash</option>
              <option>Bank</option>
            </select>

            {(action === "INCOME" || action === "EXPENSE") && (
              <select
                className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select Category</option>
                {categories
                  .filter((c) => c.type === action)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            )}

            {["BORROW", "GIVE", "REPAY", "RECEIVE"].includes(action) && (
              <input
                className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Person / Bank"
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
              />
            )}

            <input
              className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Add note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`py-3 rounded-xl font-semibold transition ${
                loading
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600 active:scale-95"
              }`}
            >
              {loading ? "Processing..." : isEdit ? "Update" : "Save"}
            </button>

            {!isDirectFlow && (
              <button
                onClick={() => setStep("ACTION")}
                className="bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-black dark:text-white py-3 rounded-xl"
              >
                Back
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ActionCard({ label, onClick }: any) {
  const styles: any = {
    Income:
      "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 hover:bg-green-500/30",
    Expense:
      "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/30",
    Borrow:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/30",
    Give:
      "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/30",
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl text-center cursor-pointer transition active:scale-95 hover:scale-[1.03] ${styles[label]}`}
    >
      {label}
    </div>
  );
}
