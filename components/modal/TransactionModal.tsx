"use client";

import { useEffect, useState, useRef } from "react"; // Added useRef
import { X, ChevronDown } from "lucide-react"; // Imported ChevronDown

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
  const [showGoalDropdown, setShowGoalDropdown] = useState(false);

  const [error, setError] = useState("");
  const [isDirectFlow, setIsDirectFlow] = useState(false);

  // References for Click-Outside Detectors
  const accountRef = useRef<HTMLDivElement | null>(null);
  const categoryRef = useRef<HTMLDivElement | null>(null);
  const goalRef = useRef<HTMLDivElement | null>(null);

  // Custom Dropdown Open States
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // ==========================================
  // CLICK OUTSIDE DETECTOR
  // ==========================================
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setShowAccountDropdown(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
      if (goalRef.current && !goalRef.current.contains(e.target as Node)) {
        setShowGoalDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ================= RESET =================
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
    setShowAccountDropdown(false);
    setShowCategoryDropdown(false);
    setShowGoalDropdown(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsDirectFlow(false);
    setStep("ACTION");
    resetForm();
    window.dispatchEvent(new Event("refreshData"));
  };

  // ================= LOAD DATA =================
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.data || []));

    fetch("/api/savings")
      .then((res) => res.json())
      .then((data) => setGoals(data.data || []));
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

      // DIRECT FLOWS ONLY (repay/receive actions)
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

  // ================= TYPE MAP =================
  const actionToTypeMap: Record<string, string> = {
    INCOME: "INCOME",
    EXPENSE: "EXPENSE",
    TRANSFER: "TRANSFER",
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
    
        {/* ================= STEP 1: ACTION SELECTOR ================= */}
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
              className="
              text-xs font-bold
              text-slate-400 dark:text-zinc-500
              hover:text-black dark:hover:text-white
              transition mt-1 text-center
              "
            >
              Cancel
            </button>
          </>
        )}
    
        {/* ================= STEP 2: THE FORM ================= */}
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
    
            {/* Amount input block */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Amount</label>
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

            {/* ✅ Transfer Direction Toggle (New) */}
            {action === "TRANSFER" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Direction</label>
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

            {/* Goal Link Dropdown */}
            {action === "TRANSFER" && goals.length > 0 && (
              <div ref={goalRef} className="relative flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Link to Goal</label>
                <div 
                  onClick={() => !isDirectFlow && setShowGoalDropdown(!showGoalDropdown)} 
                  className={`p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] text-sm flex justify-between items-center transition-all ${
                    isDirectFlow ? "opacity-50 cursor-not-allowed grayscale-[0.5]" : "cursor-pointer"
                  }`}
                >
                  <span className="font-semibold text-slate-700 dark:text-zinc-300 text-xs truncate">
                    {selectedGoalId ? goals.find(g => g.id.toString() === selectedGoalId)?.name : "General Savings"}
                  </span>
                  
                  {/* Hide the arrow if the field is locked */}
                  {!isDirectFlow && <ChevronDown size={14} className="text-slate-400" />}                  
                </div>
                {showGoalDropdown && (
                  <div className="absolute top-full left-0 w-full mt-1.5 p-1 bg-white/95 dark:bg-black/95 border border-black/[0.05] dark:border-white/[0.05] rounded-2xl shadow-xl z-50 flex flex-col animate-modalIn" onClick={(e) => e.stopPropagation()}>
                    <button 
                      type="button"
                      onClick={() => { setSelectedGoalId(""); setShowGoalDropdown(false); }} 
                      className="px-4 py-2.5 text-left text-xs font-bold rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition text-slate-700 dark:text-zinc-300"
                    >
                      General Savings
                    </button>
                    {goals.map(g => (
                      <button 
                        key={g.id} 
                        type="button"
                        onClick={() => { setSelectedGoalId(g.id.toString()); setShowGoalDropdown(false); }} 
                        className="px-4 py-2.5 text-left text-xs font-bold rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition text-slate-700 dark:text-zinc-300"
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ✅ Custom Frosted Glass Account Selector */}
            <div ref={accountRef} className="relative flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Account</label>
              <div
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-black dark:text-white text-sm cursor-pointer flex justify-between items-center"
              >
                <span className="font-semibold text-slate-700 dark:text-zinc-300">{account}</span>
                <ChevronDown size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
              </div>

              {showAccountDropdown && (
                <div className="absolute top-full left-0 w-full mt-1.5 p-1 bg-white/95 dark:bg-black/95 border border-black/[0.05] dark:border-white/[0.05] rounded-2xl shadow-xl z-50 flex flex-col animate-modalIn" onClick={(e) => e.stopPropagation()}>
                  {["Cash", "Bank"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setAccount(opt);
                        setShowAccountDropdown(false);
                      }}
                      className="px-4 py-2.5 text-left text-xs font-bold rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition text-slate-700 dark:text-zinc-300"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
    
            {/* ✅ Custom Frosted Glass Category Selector */}
            {(action === "INCOME" || action === "EXPENSE") && (
              <div ref={categoryRef} className="relative flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Category</label>
                <div
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-black dark:text-white text-sm cursor-pointer flex justify-between items-center"
                >
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">
                    {category ? categories.find((c) => c.id === category)?.name : "Select Category"}
                  </span>
                  <ChevronDown size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                </div>

                {showCategoryDropdown && (
                  <div className="absolute top-full left-0 w-full mt-1.5 p-1 max-h-40 overflow-y-auto bg-white/95 dark:bg-black/95 border border-black/[0.05] dark:border-white/[0.05] rounded-2xl shadow-xl z-50 flex flex-col animate-modalIn" onClick={(e) => e.stopPropagation()}>
                    {categories
                      .filter((c) => c.type === action)
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setCategory(c.id);
                            setShowCategoryDropdown(false);
                          }}
                          className="px-4 py-2.5 text-left text-xs font-bold rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition text-slate-700 dark:text-zinc-300"
                        >
                          {c.name}
                        </button>
                      ))}
                    {categories.filter((c) => c.type === action).length === 0 && (
                      <span className="px-4 py-3 text-center text-xs text-slate-400">No categories found</span>
                    )}
                  </div>
                )}
              </div>
            )}
    
            {/* Note / Counterparty block */}
            {["BORROW", "GIVE", "REPAY", "RECEIVE"].includes(action) && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Counterparty</label>
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
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Add Note (Optional)</label>
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
                className="
                bg-black/[0.03] dark:bg-white/[0.03]
                hover:bg-black/[0.06] dark:hover:bg-white/[0.06]
                border border-black/[0.04] dark:border-white/[0.04]
                text-black dark:text-white
                py-3 rounded-xl
                transition
                text-xs sm:text-sm font-bold
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

// ================= SIDEBAR COMPONENTS (FROSTED GLASS) ================= //

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
    Transfer:
      "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/30",
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