"use client";

import { useEffect, useState } from "react";

export default function TransactionModal() {
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<"ACTION" | "FORM">("ACTION");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [loading, setLoading] = useState(false);

  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("Cash");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

  const [error, setError] = useState("");
  const [isDirectFlow, setIsDirectFlow] = useState(false);

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

      // DIRECT FLOWS ONLY (no edit anymore)
      if (typeof e.detail === "object") {
        if (e.detail.type === "DEBT_REPAID") {
          setAction("REPAY");
          setStep("FORM");
          setIsDirectFlow(true);
          setEntity(e.detail.entity || "");
        } else if (e.detail.type === "RECEIVABLE_RECEIVED") {
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

    if ((action === "INCOME" || action === "EXPENSE") && !category) {
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
        date: new Date().toLocaleDateString("en-CA"),
        note,
      };

      if (category) body.category_id = category;
      if (entity) body.entity = entity;

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
      className="
      fixed inset-0 z-50
      bg-black/60 backdrop-blur-sm
      flex items-center justify-center
      "
      onClick={closeModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
        w-[340px]
        bg-white dark:bg-black
        border border-gray-200 dark:border-zinc-900
        text-black dark:text-white
        rounded-3xl
        p-5
        shadow-2xl
        flex flex-col gap-4
        animate-modalIn
        "
      >
    
        {/* ================= ACTION ================= */}
        {step === "ACTION" && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Select Action
              </h3>
    
              <button
                onClick={closeModal}
                className="
                w-8 h-8
                flex items-center justify-center
                rounded-full
                text-gray-400 dark:text-zinc-500
                hover:text-black dark:hover:text-white
                hover:bg-gray-100 dark:hover:bg-zinc-900
                transition
                "
              >
                ✕
              </button>
            </div>
    
            <div className="grid grid-cols-2 gap-3">
              <ActionCard
                label="Income"
                onClick={() => {
                  setAction("INCOME");
                  setStep("FORM");
                }}
              />
    
              <ActionCard
                label="Expense"
                onClick={() => {
                  setAction("EXPENSE");
                  setStep("FORM");
                }}
              />
    
              <ActionCard
                label="Borrow"
                onClick={() => {
                  setAction("BORROW");
                  setStep("FORM");
                }}
              />
    
              <ActionCard
                label="Give"
                onClick={() => {
                  setAction("GIVE");
                  setStep("FORM");
                }}
              />
            </div>
    
            <button
              onClick={closeModal}
              className="
              text-sm
              text-gray-500 dark:text-zinc-500
              hover:text-black dark:hover:text-white
              transition
              "
            >
              Cancel
            </button>
          </>
        )}
    
        {/* ================= FORM ================= */}
        {step === "FORM" && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-black dark:text-white">
                {action === "INCOME"
                  ? "Add Income"
                  : action === "EXPENSE"
                  ? "Add Expense"
                  : action === "BORROW"
                  ? "Borrow Money"
                  : action === "REPAY"
                  ? "Repay Debt"
                  : action === "RECEIVE"
                  ? "Receive Money"
                  : "Give Money"}
              </h3>
    
              <button
                onClick={closeModal}
                className="
                w-8 h-8
                flex items-center justify-center
                rounded-full
                text-gray-400 dark:text-zinc-500
                hover:text-black dark:hover:text-white
                hover:bg-gray-100 dark:hover:bg-zinc-900
                transition
                "
              >
                ✕
              </button>
            </div>
    
            <input
              className="
              p-3 rounded-2xl
              bg-gray-50 dark:bg-zinc-950
              border border-gray-200 dark:border-zinc-900
              text-black dark:text-white
              placeholder:text-gray-400 dark:placeholder:text-zinc-500
              focus:outline-none focus:ring-2 focus:ring-green-500
              "
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
    
            <select
              className="
              p-3 rounded-2xl
              bg-gray-50 dark:bg-zinc-950
              border border-gray-200 dark:border-zinc-900
              text-black dark:text-white
              focus:outline-none focus:ring-2 focus:ring-green-500
              "
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            >
              <option>Cash</option>
              <option>Bank</option>
            </select>
    
            {(action === "INCOME" || action === "EXPENSE") && (
              <select
                className="
                p-3 rounded-2xl
                bg-gray-50 dark:bg-zinc-950
                border border-gray-200 dark:border-zinc-900
                text-black dark:text-white
                focus:outline-none focus:ring-2 focus:ring-green-500
                "
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
                className="
                p-3 rounded-2xl
                bg-gray-50 dark:bg-zinc-950
                border border-gray-200 dark:border-zinc-900
                text-black dark:text-white
                placeholder:text-gray-400 dark:placeholder:text-zinc-500
                focus:outline-none focus:ring-2 focus:ring-green-500
                "
                placeholder="Person / Bank"
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
              />
            )}
    
            <input
              className="
              p-3 rounded-2xl
              bg-gray-50 dark:bg-zinc-950
              border border-gray-200 dark:border-zinc-900
              text-black dark:text-white
              placeholder:text-gray-400 dark:placeholder:text-zinc-500
              focus:outline-none focus:ring-2 focus:ring-green-500
              "
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
              className={`
              py-3 rounded-2xl
              font-semibold transition
              ${
                loading
                  ? "bg-gray-400 dark:bg-zinc-700 cursor-not-allowed text-white"
                  : "bg-green-500 hover:bg-green-400 active:scale-95 text-black"
              }
              `}
            >
              {loading ? "Processing..." : "Save"}
            </button>
    
            {!isDirectFlow && (
              <button
                onClick={() => setStep("ACTION")}
                className="
                bg-gray-100 dark:bg-zinc-900
                hover:bg-gray-200 dark:hover:bg-zinc-800
                text-black dark:text-white
                py-3 rounded-2xl
                transition
                "
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
