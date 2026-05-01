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

  // categories
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.data || []));
  }, []);

  // event listener (IMPORTANT)
  useEffect(() => {
    const handler = (e: any) => {
      setShowModal(true);

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

  const actionToTypeMap: Record<string, string> = {
    INCOME: "INCOME",
    EXPENSE: "EXPENSE",
    BORROW: "DEBT_TAKEN",
    GIVE: "RECEIVABLE_GIVEN",
    REPAY: "DEBT_REPAID",
    RECEIVE: "RECEIVABLE_RECEIVED",
  };

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="w-[340px] bg-white dark:bg-slate-900 rounded-2xl p-5">
        
        <h3 className="font-semibold">
          {isEdit ? "Edit Transaction" : "Add Transaction"}
        </h3>

        <input value={amount} onChange={(e) => setAmount(e.target.value)} />

        {error && <div className="text-red-500">{error}</div>}

        <button onClick={handleSubmit}>
          {loading ? "Processing..." : isEdit ? "Update" : "Save"}
        </button>

        <button onClick={closeModal}>Close</button>
      </div>
    </div>
  );
}
