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

      // 👉 CREATE FLOW
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

      // 👉 EDIT FLOW
      if (typeof e.detail === "object") {
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

    // ✅ FIX: don't force category on edit
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
        className="w-[340px] bg-white/90 dark:bg-slate-900/90 border border-gray-200 dark:border-slate-700 text-black dark:text-white rounded-2xl p-5 shadow-2xl flex flex-col gap-4"
      >
        {/* ================= ACTION ================= */}
        {step === "ACTION" && (
          <>
            <div className="flex justify-between">
              <h3 className="text-lg font-semibold">Select Action</h3>
              <button onClick={closeModal}>✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setAction("INCOME"); setStep("FORM"); }}>Income</button>
              <button onClick={() => { setAction("EXPENSE"); setStep("FORM"); }}>Expense</button>
              <button onClick={() => { setAction("BORROW"); setStep("FORM"); }}>Borrow</button>
              <button onClick={() => { setAction("GIVE"); setStep("FORM"); }}>Give</button>
            </div>
          </>
        )}

        {/* ================= FORM ================= */}
        {step === "FORM" && (
          <>
            <div className="flex justify-between">
              <h3 className="font-semibold">
                {isEdit ? "Edit Transaction" : "Add Transaction"}
              </h3>
              <button onClick={closeModal}>✕</button>
            </div>

            <input
              className="p-3 rounded-xl border"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <select value={account} onChange={(e) => setAccount(e.target.value)}>
              <option>Cash</option>
              <option>Bank</option>
            </select>

            {(action === "INCOME" || action === "EXPENSE") && (
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
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

            {(action === "BORROW" || action === "GIVE") && (
              <input
                placeholder="Entity"
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
              />
            )}

            <input
              placeholder="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <button onClick={handleSubmit}>
              {loading
                ? "Processing..."
                : isEdit
                ? "Update"
                : "Save"}
            </button>

            {!isDirectFlow && (
              <button onClick={() => setStep("ACTION")}>Back</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
