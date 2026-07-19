"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Dropdown from "@/components/ui/Dropdown";
import NewGoalForm from "./NewGoalForm";

type Category = {
  id: string;
  name: string;
  type: string;
};

type Goal = {
  id: number;
  name: string;
};

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [direction, setDirection] = useState("TO_SAVINGS");

  const [error, setError] = useState("");
  const [isDirectFlow, setIsDirectFlow] = useState(false);

  // Reset form states back to initial values
  const resetForm = () => {
    setAmount("");
    setCategory("");
    setEntity("");
    setNote("");
    setError("");
    setAction("");
    setAccount("Cash");
    setSelectedGoalId("");
    setDirection("TO_SAVINGS");
  };

  const closeModal = () => {
    setShowModal(false);
    setIsDirectFlow(false);
    setStep("ACTION");
    resetForm();
    window.dispatchEvent(new Event("refreshData"));
  };

  // Load categories and savings goals
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.data || []));

    fetch("/api/savings")
      .then((res) => res.json())
      .then((data) => setGoals(data.data || []));
  }, []);

  // Event listener for opening the modal from outside actions
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
        } else if (e.detail === "NEW_GOAL") {
          setAction("NEW_GOAL");
          setStep("FORM");
          setIsDirectFlow(true);
        } else {
          setStep("ACTION");
          setIsDirectFlow(false);
        }
      }

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
        } else if (e.detail.type === "TRANSFER") {
          setAction("TRANSFER");
          setDirection(e.detail.direction || "TO_SAVINGS");
          setStep("FORM");
          setIsDirectFlow(true);
          if (e.detail.goalId) setSelectedGoalId(e.detail.goalId.toString());
          if (e.detail.goalName) setNote(`Funding Goal: ${e.detail.goalName}`);
        }
      }
    };

    window.addEventListener("openAdd", handler);
    return () => window.removeEventListener("openAdd", handler);
  }, []);

  const actionToTypeMap: Record<string, string> = {
    INCOME: "INCOME",
    EXPENSE: "EXPENSE",
    TRANSFER: "TRANSFER",
    BORROW: "DEBT_TAKEN",
    GIVE: "RECEIVABLE_GIVEN",
    REPAY: "DEBT_REPAID",
    RECEIVE: "RECEIVABLE_RECEIVED",
  };

  const handleSubmit = async () => {
    if (loading) return;
    setError("");

    const amountNumber = Number(amount);

    if (!amount || amountNumber <= 0 || isNaN(amountNumber)) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    if ((action === "INCOME" || action === "EXPENSE") && !category) {
      setError("Select a category.");
      return;
    }

    if (
      ["BORROW", "GIVE", "REPAY", "RECEIVE"].includes(action) &&
      !entity.trim()
    ) {
      setError("Enter person or counterpart entity.");
      return;
    }

    setLoading(true);

    try {
      const body: any = {
        type: actionToTypeMap[action],
        amount: amountNumber,
        account,
        date: new Date().toLocaleDateString("en-CA"),
        note: note.trim() || null,
        direction: action === "TRANSFER" ? direction : null,
        savings_goal_id: action === "TRANSFER" && selectedGoalId ? parseInt(selectedGoalId) : null,
      };

      if (category) body.category_id = category;
      if (entity) body.entity = entity.trim();

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
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!showModal) return null;

  // Format states to exact structured option formats for the global Dropdown component
  const accountOptions = [
    { value: "Cash", label: "Cash" },
    { value: "Bank", label: "Bank" },
  ];

  const categoryOptions = categories
    .filter((c) => c.type === action)
    .map((c) => ({ value: c.id, label: c.name }));

  const goalOptions = [
    { value: "", label: "General Savings" },
    ...goals.map((g) => ({ value: g.id.toString(), label: g.name })),
  ];

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={closeModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          w-[340px]
          bg-gradient-to-br from-white to-slate-50
          dark:from-[#0d1318] dark:to-[#080b0f]
          backdrop-blur-xl
          border border-black/[0.06] dark:border-white/[0.06]
          text-black dark:text-white
          rounded-3xl p-6
          shadow-2xl flex flex-col gap-4
          animate-modalIn relative
        "
      >
        {/* STEP 1: ACTION SELECTOR */}
        {step === "ACTION" && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-black dark:text-white leading-none">
                Select Action
              </h3>
              <button
                onClick={closeModal}
                className="
                  w-7 h-7 flex items-center justify-center rounded-full
                  text-slate-400 dark:text-zinc-500 hover:text-black dark:hover:text-white
                  bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]
                  transition duration-150
                "
              >
                <X size={14} />
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
              <div className="col-span-2">
                <ActionCard
                  label="Transfer"
                  onClick={() => {
                    setAction("TRANSFER");
                    setStep("FORM");
                  }}
                />
              </div>
            </div>

            <button
              onClick={closeModal}
              className="text-xs font-bold text-slate-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition mt-1 text-center"
            >
              Cancel
            </button>
          </>
        )}

        {/* STEP 2: FORM COMPOSITION */}
        {step === "FORM" && (
          <>
            <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.04] pb-2">
              <h3 className="font-bold text-black dark:text-white text-base leading-none">
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
                  : action === "TRANSFER"
                  ? "Savings Deposit"
                  : action === "NEW_GOAL"
                  ? "Create Savings Goal"
                  : "Give Money"}
              </h3>
              <button
                onClick={closeModal}
                className="
                  w-7 h-7 flex items-center justify-center rounded-full
                  text-slate-400 dark:text-zinc-500 hover:text-black dark:hover:text-white
                  bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]
                  transition duration-150
                "
              >
                <X size={14} />
              </button>
            </div>

            {/* If selected action is NEW_GOAL, render our isolated goal creation form component */}
            {action === "NEW_GOAL" ? (
              <NewGoalForm onSuccess={closeModal} onClose={closeModal} />
            ) : (
              <>
                {/* Amount entry block */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                    Amount
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || Number(val) >= 0) {
                        setAmount(val);
                      }
                    }}
                    className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:bg-white dark:focus:bg-zinc-950 transition-all duration-200 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                {/* Transfer Direction toggle */}
                {action === "TRANSFER" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                      Direction
                    </label>
                    <div className="flex gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setDirection("TO_SAVINGS")}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition ${direction === "TO_SAVINGS" ? "bg-indigo-500 text-white shadow-sm" : "text-slate-500"}`}
                      >
                        To Savings
                      </button>
                      <button
                        type="button"
                        onClick={() => setDirection("FROM_SAVINGS")}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition ${direction === "FROM_SAVINGS" ? "bg-indigo-500 text-white shadow-sm" : "text-slate-500"}`}
                      >
                        From Savings
                      </button>
                    </div>
                  </div>
                )}

                {/* Reusable Dropdown for Goal Linking */}
                {action === "TRANSFER" && (
                  <Dropdown
                    label="Link to Goal"
                    options={goalOptions}
                    selectedValue={selectedGoalId}
                    onChange={(val) => setSelectedGoalId(val)}
                    disabled={isDirectFlow}
                    placeholder="General Savings"
                  />
                )}

                {/* Reusable Dropdown for Primary Account selection */}
                <Dropdown
                  label="Account"
                  options={accountOptions}
                  selectedValue={account}
                  onChange={(val) => setAccount(val)}
                />

                {/* Reusable Dropdown for Category selection */}
                {(action === "INCOME" || action === "EXPENSE") && (
                  <Dropdown
                    label="Category"
                    options={categoryOptions}
                    selectedValue={category}
                    onChange={(val) => setCategory(val)}
                    placeholder="Select Category"
                  />
                )}

                {/* Notes and counterpart inputs */}
                {["BORROW", "GIVE", "REPAY", "RECEIVE"].includes(action) && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                      Counterparty
                    </label>
                    <input
                      type="text"
                      placeholder="Person / Bank (e.g. Rahim)"
                      value={entity}
                      onChange={(e) => setEntity(e.target.value)}
                      className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:bg-white dark:focus:bg-zinc-950 transition-all duration-200 text-sm"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                    Add Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Add note..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:bg-white dark:focus:bg-zinc-950 transition-all duration-200 text-sm"
                  />
                </div>

                {error && <div className="text-xs text-red-500 font-bold leading-normal">{error}</div>}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-3 mt-2 rounded-xl bg-green-500 hover:bg-green-400 disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-black font-extrabold text-sm transition active:scale-95 shadow-md"
                >
                  {loading ? "Saving..." : "Save"}
                </button>

                {!isDirectFlow && (
                  <button
                    onClick={() => setStep("ACTION")}
                    className="bg-black/[0.03] dark:bg-white/[0.03] hover:bg-black/[0.06] dark:hover:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.04] text-black dark:text-white py-3 rounded-xl transition text-xs sm:text-sm font-bold"
                  >
                    Back
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ActionCard({ label, onClick }: any) {
  const styles: any = {
    Income: "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 hover:bg-green-500/30",
    Expense: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/30",
    Borrow: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/30",
    Give: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/30",
    Transfer: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/30",
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl text-center cursor-pointer transition font-bold text-xs sm:text-sm active:scale-95 hover:scale-[1.03] ${styles[label]}`}
    >
      {label}
    </div>
  );
}