"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useRefresh } from "@/hooks/useRefresh";
import { 
  Plus, 
  Trash2, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Play,
  ArrowRightLeft
} from "lucide-react";

type Plan = {
  id: number;
  type: "EXPENSE" | "INCOME" | "DEBT" | "RECEIVABLE";
  amount: string;
  target_id: string | null;
  target_name: string;
  date: string;
  note: string | null;
  status: "PENDING" | "CONFIRMED" | "SKIPPED";
};

type Category = {
  id: string;
  name: string;
  type: string;
};

export default function BudgetPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  
  // Lookup Lists for Autocomplete
  const [categories, setCategories] = useState<Category[]>([]);
  const [entities, setEntities] = useState<string[]>([]);

  // Modals & Forms State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickCategoryModal, setShowQuickCategoryModal] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<Plan | null>(null);

  // Form inputs
  const [date, setDate] = useState("");
  const [type, setType] = useState<"EXPENSE" | "INCOME" | "DEBT" | "RECEIVABLE">("EXPENSE");
  const [targetSearch, setTargetSearch] = useState("");
  const [selectedTarget, setSelectedDateTarget] = useState<{ id: string | null; name: string } | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [showTargetDropdown, setShowTargetDropdown] = useState(false);

  // Process Modal Inputs
  const [processAccount, setAccount] = useState("Cash");
  const [partialAmount, setPartialAmount] = useState("");
  const [isPartial, setIsPartial] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-indexed (1-12)

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // ==========================================
  // FETCH PLANS AND LEDGER STATUS
  // ==========================================
  const loadData = async () => {
    try {
      // 1. Fetch current cash balance
      const balRes = await fetch("/api/balance", { cache: "no-store" });
      const balJson = await balRes.json();
      setCurrentBalance(Number(balJson.balance || 0));

      // 2. Fetch planned items for currently viewed month
      const planRes = await fetch(`/api/budget?month=${month}&year=${year}`, { cache: "no-store" });
      const planJson = await planRes.json();
      setPlans(planJson.data || []);
    } catch (err) {
      console.error("Failed to load budget planning data:", err);
    }
  };

  useRefresh(loadData);

  // Load Autocomplete Lookups once on mount
  useEffect(() => {
    fetch("/api/categories")
      .then(res => res.json())
      .then(d => setCategories(d.data || []));

    fetch("/api/transactions")
      .then(res => res.json())
      .then(d => {
        const txs = d.data || [];
        const uniqueEntities = Array.from(new Set(txs.map((t: any) => t.entity_name).filter(Boolean))) as string[];
        setEntities(uniqueEntities);
      });
  }, []);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() + 1, 1));
  };

  // ==========================================
  // AUTCOMPLETE LOGIC
  // ==========================================
  const getFilteredSuggestions = () => {
    const cleanQuery = targetSearch.trim().toLowerCase();
    if (type === "EXPENSE" || type === "INCOME") {
      const filtered = categories.filter(c => c.type === type);
      if (!cleanQuery) return filtered;
      return filtered.filter(c => c.name.toLowerCase().includes(cleanQuery));
    } else {
      if (!cleanQuery) return entities;
      return entities.filter(e => e.toLowerCase().includes(cleanQuery));
    }
  };

  const suggestions = getFilteredSuggestions();
  const showCreateCategoryTrigger = 
    (type === "EXPENSE" || type === "INCOME") && 
    targetSearch.trim() !== "" && 
    !suggestions.some(s => s.name.toLowerCase() === targetSearch.trim().toLowerCase());

  // Quick Category Save Inline Handler
  const handleQuickCategorySave = async () => {
    if (!targetSearch.trim()) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: targetSearch.trim(), type }),
      });
      const json = await res.json();
      if (json.success) {
        const newCat = json.data;
        setCategories([...categories, newCat]);
        setSelectedDateTarget({ id: newCat.id, name: newCat.name });
        setTargetSearch(newCat.name);
        setShowQuickCategoryModal(false);
        setShowTargetDropdown(false);
      } else {
        alert(json.error || "Failed to create category");
      }
    } catch {
      alert("Failed to create category");
    }
  };

  // ==========================================
  // FORECAST CALCULATIONS
  // ==========================================
  let expectedIncome = 0;
  let expectedExpenses = 0;
  let expectedDebts = 0;
  let expectedReceivables = 0;

  plans.forEach(p => {
    if (p.status !== "PENDING") return;
    const amt = Number(p.amount);
    if (p.type === "INCOME") expectedIncome += amt;
    if (p.type === "EXPENSE") expectedExpenses += amt;
    if (p.type === "DEBT") expectedDebts += amt;
    if (p.type === "RECEIVABLE") expectedReceivables += amt;
  });

  const projectedPosition = 
    currentBalance + expectedIncome - expectedExpenses - expectedDebts + expectedReceivables;

  // ==========================================
  // SAVE PLAN HANDLER
  // ==========================================
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const targetName = selectedTarget ? selectedTarget.name : targetSearch.trim();
    const targetId = selectedTarget ? selectedTarget.id : null;

    if (!targetName || !amount || !date) {
      setError("Please fill out all required fields.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: Number(amount),
          target_id: targetId,
          target_name: targetName,
          date,
          note: note.trim() || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save plan.");
      }

      // Reset Form fields
      setDate("");
      setAmount("");
      setNote("");
      setTargetSearch("");
      setSelectedDateTarget(null);
      setShowAddModal(false);
      loadData();

    } catch (err: any) {
      setError(err.message || "Failed to save budget plan.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // PROCESS ACTION HANDLERS
  // ==========================================

  // A. CONFIRM (Converts planning item directly to real ledger transaction)
  const handleConfirm = async (amtToConfirm = Number(processingPlan?.amount)) => {
    if (!processingPlan) return;
    setLoading(true);
    setError("");

    try {
      const txPayload: any = {
        type: processingPlan.type === "DEBT" ? "DEBT_TAKEN" : processingPlan.type === "RECEIVABLE" ? "RECEIVABLE_GIVEN" : processingPlan.type,
        amount: amtToConfirm,
        account: processAccount,
        date: new Date().toLocaleDateString("en-CA"), // Processed on actual today date
        note: processingPlan.note ? `${processingPlan.note} (Planned)` : "Planned event confirmed",
      };

      if (processingPlan.type === "INCOME" || processingPlan.type === "EXPENSE") {
        txPayload.category_id = processingPlan.target_id;
      } else {
        txPayload.entity = processingPlan.target_name;
      }

      // 1. Write actual transaction into standard ledger
      const txRes = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txPayload),
      });

      if (!txRes.ok) {
        const errData = await txRes.json();
        throw new Error(errData.error || "Failed to create transaction.");
      }

      // 2. Update Plan Status to CONFIRMED
      const statusRes = await fetch(`/api/budget/${processingPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      });

      if (!statusRes.ok) {
        throw new Error("Transaction created, but plan status failed to update.");
      }

      window.dispatchEvent(new Event("refreshData"));
      setProcessingPlan(null);
      setIsPartial(false);
      setPartialAmount("");
      loadData();

    } catch (err: any) {
      setError(err.message || "Failed to process confirmation.");
    } finally {
      setLoading(false);
    }
  };

  // B. PARTIAL (Logs transaction for partial amount, updates remaining on plan)
  const handlePartial = async () => {
    if (!processingPlan) return;
    const partialAmt = Number(partialAmount);
    const planAmt = Number(processingPlan.amount);

    if (isNaN(partialAmt) || partialAmt <= 0 || partialAmt >= planAmt) {
      alert("Enter a valid partial amount less than the total planned amount.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Write partial transaction into standard ledger
      const txPayload: any = {
        type: processingPlan.type === "DEBT" ? "DEBT_TAKEN" : processingPlan.type === "RECEIVABLE" ? "RECEIVABLE_GIVEN" : processingPlan.type,
        amount: partialAmt,
        account: processAccount,
        date: new Date().toLocaleDateString("en-CA"),
        note: processingPlan.note ? `${processingPlan.note} (Partial planned)` : "Partial planned event",
      };

      if (processingPlan.type === "INCOME" || processingPlan.type === "EXPENSE") {
        txPayload.category_id = processingPlan.target_id;
      } else {
        txPayload.entity = processingPlan.target_name;
      }

      const txRes = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txPayload),
      });

      if (!txRes.ok) {
        const errData = await txRes.json();
        throw new Error(errData.error || "Failed to create transaction.");
      }

      // 2. Reduce the plan's amount to reflect remaining portion, leaving plan open
      const remainingAmount = planAmt - partialAmt;
      const statusRes = await fetch(`/api/budget/${processingPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: remainingAmount }),
      });

      if (!statusRes.ok) {
        throw new Error("Partial transaction created, but plan balance failed to update.");
      }

      window.dispatchEvent(new Event("refreshData"));
      setProcessingPlan(null);
      setIsPartial(false);
      setPartialAmount("");
      loadData();

    } catch (err: any) {
      setError(err.message || "Failed to process partial transaction.");
    } finally {
      setLoading(false);
    }
  };

  // C. SKIP
  const handleSkip = async () => {
    if (!processingPlan) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/budget/${processingPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SKIPPED" }),
      });

      if (!res.ok) throw new Error("Failed to skip plan.");

      setProcessingPlan(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // D. RESCHEDULE (Update date, updates forecasting calculations automatically)
  const handleReschedule = async () => {
    if (!processingPlan || !rescheduleDate) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/budget/${processingPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: rescheduleDate }),
      });

      if (!res.ok) throw new Error("Failed to reschedule plan.");

      setProcessingPlan(null);
      setIsRescheduling(false);
      setRescheduleDate("");
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // E. DELETE
  const handleDeletePlan = async (id: number) => {
    if (!confirm("Are you sure you want to delete this planned item?")) return;
    try {
      const res = await fetch(`/api/budget/${id}`, { method: "DELETE" });
      if (res.ok) loadData();
    } catch (err) {
      console.error("Failed to delete plan:", err);
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case "INCOME": return "bg-green-500/10 text-green-500";
      case "EXPENSE": return "bg-red-500/10 text-red-500";
      case "DEBT": return "bg-blue-500/10 text-blue-500";
      case "RECEIVABLE": return "bg-yellow-500/10 text-yellow-500";
      default: return "bg-zinc-800 text-zinc-400";
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 px-1 sm:px-4 pb-16">
        
        {/* HEADER CONTROLS */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-black dark:text-white">Budget Planning</h1>
            <p className="text-sm text-slate-500 dark:text-zinc-500">Plan ahead, schedule events, and forecast your actual projected month-end wealth.</p>
          </div>

          <div className="flex gap-2 items-center self-end sm:self-center">
            {/* Month Switches */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800">
              <button onClick={handlePrevMonth} className="p-2 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition text-zinc-500 hover:text-black dark:hover:text-white">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-bold text-black dark:text-white px-2 min-w-[120px] text-center">
                {monthName}
              </span>
              <button onClick={handleNextMonth} className="p-2 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition text-zinc-500 hover:text-black dark:hover:text-white">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Add Plan trigger */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-bold text-sm transition active:scale-95 flex items-center gap-1.5"
            >
              <Plus size={16} /> Add Plan
            </button>
          </div>
        </div>

        {/* ==========================================
            FINANCIAL FORECASTING SUMMARY CARD
            ========================================== */}
        <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 p-6 rounded-3xl shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">Projections for {monthName}</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-1">
            <ProjectionBlock label="Current Balance" val={currentBalance} color="text-zinc-700 dark:text-zinc-300" />
            <ProjectionBlock label="Expected Income" val={expectedIncome} color="text-green-500" prefix="+" />
            <ProjectionBlock label="Expected Expenses" val={expectedExpenses} color="text-red-500" prefix="-" />
            <ProjectionBlock label="Expected Debts" val={expectedDebts} color="text-blue-500" prefix="-" />
            <ProjectionBlock label="Expected Receivables" val={expectedReceivables} color="text-yellow-500" prefix="+" />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-zinc-900/60 mt-2">
            <span className="text-sm font-bold text-black dark:text-white">Projected Month-End Position</span>
            <span className="text-lg sm:text-xl font-black text-green-500">
              {projectedPosition.toLocaleString("en-BD")} Tk
            </span>
          </div>
        </div>

        {/* ==========================================
            PLANNED ITEMS LEDGER GRID
            ========================================== */}
        <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-3xl overflow-hidden">
          {/* HEADER */}
          <div className="grid grid-cols-12 px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-900 leading-none">
            <div className="col-span-3">Target</div>
            <div className="col-span-2">Expected Date</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-3">Note</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>

          {/* LIST */}
          <div className="divide-y divide-slate-100 dark:divide-zinc-900">
            {plans.map((p) => {
              const amt = Number(p.amount);
              return (
                <div key={p.id} className="grid grid-cols-12 items-center px-4 py-4 hover:bg-slate-50 dark:hover:bg-zinc-900/20 transition text-sm">
                  
                  {/* Target Name */}
                  <div className="col-span-3 font-bold text-black dark:text-white truncate">
                    {p.target_name}
                  </div>

                  {/* Date */}
                  <div className="col-span-2 text-xs text-slate-500 dark:text-zinc-500">
                    {new Date(p.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </div>

                  {/* Type */}
                  <div className="col-span-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${getBadgeStyle(p.type)}`}>
                      {p.type}
                    </span>
                  </div>

                  {/* Note / Description */}
                  <div className="col-span-3 text-xs text-slate-400 dark:text-zinc-500 truncate pr-4">
                    {p.note || "—"}
                  </div>

                  {/* Amount / Process controls */}
                  <div className="col-span-2 flex items-center justify-end gap-3 text-right">
                    <span className="font-extrabold text-black dark:text-white shrink-0">
                      {amt.toLocaleString("en-BD")} Tk
                    </span>

                    {/* Actions if pending */}
                    {p.status === "PENDING" ? (
                      <button
                        onClick={() => setProcessingPlan(p)}
                        className="px-2.5 py-1 rounded-lg bg-green-500 text-black hover:bg-green-400 text-xs font-black transition active:scale-95 shrink-0 shadow-sm"
                      >
                        Due
                      </button>
                    ) : (
                      <span className={`text-[10px] font-black uppercase tracking-wider ${p.status === "CONFIRMED" ? "text-green-500" : "text-zinc-500"}`}>
                        {p.status}
                      </span>
                    )}

                    {/* Delete Plan */}
                    <button
                      onClick={() => handleDeletePlan(p.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition shrink-0 ml-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                </div>
              );
            })}

            {plans.length === 0 && (
              <div className="p-12 text-center text-slate-400 dark:text-zinc-500 text-sm">
                No planned items scheduled for {monthName}.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ==========================================
          ADD PLAN MODAL & SEARCH DROPDOWN
          ========================================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-[400px] shadow-2xl flex flex-col gap-4 animate-modalIn" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-900 pb-3">
              <h3 className="text-lg font-bold text-black dark:text-white">Create Budget Plan</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-black dark:hover:text-white transition rounded-full hover:bg-slate-100 dark:hover:bg-zinc-900">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="flex flex-col gap-3">
              {/* Type Select */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Planning Type</label>
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value as any);
                    setSelectedDateTarget(null);
                    setTargetSearch("");
                  }}
                  className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-black dark:text-white"
                >
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                  <option value="DEBT">Debt</option>
                  <option value="RECEIVABLE">Receivable</option>
                </select>
              </div>

              {/* Autocomplete Target Search Selector */}
              <div className="flex flex-col gap-1 relative">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  {type === "EXPENSE" ? "Expense Category" : type === "INCOME" ? "Income Category" : "Counterparty"}
                </label>
                
                <input
                  type="text"
                  required
                  placeholder={type === "EXPENSE" || type === "INCOME" ? "Search Category..." : "Person / Bank..."}
                  value={targetSearch}
                  onFocus={() => setShowTargetDropdown(true)}
                  onChange={(e) => {
                    setTargetSearch(e.target.value);
                    setSelectedDateTarget(null);
                    setShowTargetDropdown(true);
                  }}
                  className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-black dark:text-white"
                />

                {/* Autocomplete dropdown suggestions */}
                {showTargetDropdown && (
                  <div className="absolute top-full left-0 w-full mt-1.5 max-h-40 overflow-y-auto bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 flex flex-col divide-y divide-slate-100 dark:divide-zinc-900">
                    {suggestions.map((s, idx) => {
                      const nameStr = typeof s === "string" ? s : s.name;
                      const idStr = typeof s === "string" ? null : s.id;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedDateTarget({ id: idStr, name: nameStr });
                            setTargetSearch(nameStr);
                            setShowTargetDropdown(false);
                          }}
                          className="px-4 py-2.5 text-left text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-900 transition text-slate-700 dark:text-zinc-300"
                        >
                          {nameStr}
                        </button>
                      );
                    })}

                    {/* Quick Create Category Modal trigger if category is missing */}
                    {showCreateCategoryTrigger && (
                      <button
                        type="button"
                        onClick={() => setShowQuickCategoryModal(true)}
                        className="px-4 py-3 text-left text-xs font-bold text-green-500 hover:bg-green-500/10 transition leading-normal border-t border-slate-100 dark:border-zinc-900"
                      >
                        No category found. Create "{targetSearch}"?
                      </button>
                    )}

                    {suggestions.length === 0 && !showCreateCategoryTrigger && (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Type to select or use new name
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Amount</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-black dark:text-white"
                />
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Scheduled Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-black dark:text-white"
                />
              </div>

              {/* Optional Note */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Add Note (Optional)</label>
                <input
                  type="text"
                  placeholder="Add note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-black dark:text-white"
                />
              </div>

              {error && <div className="text-xs text-red-500 font-bold text-center leading-normal">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 rounded-xl bg-green-500 hover:bg-green-400 disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-black font-extrabold text-sm transition active:scale-95 shadow-md"
              >
                {loading ? "Saving plan..." : "Create Plan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          QUICK CREATE CATEGORY DIALOG (MODAL)
          ========================================== */}
      {showQuickCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-[340px] text-center shadow-2xl flex flex-col gap-4 animate-modalIn">
            <h3 className="text-lg font-bold text-black dark:text-white">Create Category</h3>
            
            <div className="text-left space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-500">Category Name</label>
                <input
                  type="text"
                  disabled
                  value={targetSearch}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-500 border border-transparent text-sm font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-500">Category Type</label>
                <input
                  type="text"
                  disabled
                  value={type}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-500 border border-transparent text-sm font-semibold"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-center mt-2">
              <button onClick={handleQuickCategorySave} className="px-5 py-2.5 rounded-xl bg-green-500 text-black font-bold text-sm hover:bg-green-400 transition active:scale-95">
                Save Category
              </button>
              <button onClick={() => setShowQuickCategoryModal(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold text-sm transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          DUE EVENT PROCESSING DIALOG (PROCESS MODAL)
          ========================================== */}
      {processingPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setProcessingPlan(null); setIsPartial(false); setIsRescheduling(false); }}>
          <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-[360px] text-center shadow-2xl flex flex-col gap-4 animate-modalIn" onClick={(e) => e.stopPropagation()}>
            
            <div className="border-b border-slate-100 dark:border-zinc-900 pb-3 flex justify-between items-center text-left">
              <div>
                <h3 className="text-base font-bold text-black dark:text-white leading-none">{processingPlan.target_name}</h3>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider block mt-1">
                  Due amount: {Number(processingPlan.amount).toLocaleString("en-BD")} Tk
                </span>
              </div>
              <button onClick={() => { setProcessingPlan(null); setIsPartial(false); setIsRescheduling(false); }} className="p-1 text-slate-400 hover:text-black dark:hover:text-white transition rounded-full hover:bg-slate-100 dark:hover:bg-zinc-900">
                <X size={14} />
              </button>
            </div>

            {/* ERROR OR STATUS MESSAGES */}
            {error && <div className="text-xs text-red-500 font-bold leading-normal">{error}</div>}

            {/* NESTED CONTROLS FOR PARTIAL & RESCHEDULE */}
            {!isPartial && !isRescheduling ? (
              <div className="flex flex-col gap-2.5">
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-normal">How do you want to handle this scheduled event?</p>
                
                {/* Account Method picker for Confirmations */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5"><ArrowRightLeft size={13} /> Account</span>
                  <select value={processAccount} onChange={(e) => setAccount(e.target.value)} className="bg-transparent text-xs font-bold text-black dark:text-white focus:outline-none cursor-pointer">
                    <option>Cash</option>
                    <option>Bank</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={() => handleConfirm()} className="py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-extrabold text-xs transition">
                    Confirm
                  </button>
                  <button onClick={() => setIsPartial(true)} className="py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 font-bold text-xs border border-blue-500/20 transition">
                    Partial
                  </button>
                  <button onClick={() => setIsRescheduling(true)} className="py-2.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 font-bold text-xs border border-yellow-500/20 transition">
                    Reschedule
                  </button>
                  <button onClick={handleSkip} className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs border border-transparent dark:border-zinc-800/80 transition">
                    Skip
                  </button>
                </div>
              </div>
            ) : isPartial ? (
              /* PARTIAL COMPLETION WORKFLOW */
              <div className="flex flex-col gap-3">
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold text-left">Enter amount paid/received:</p>
                <input
                  type="number"
                  placeholder="Partial Amount"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-green-500 text-xs text-black dark:text-white"
                />

                <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900/60 p-2 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">Account</span>
                  <select value={processAccount} onChange={(e) => setAccount(e.target.value)} className="bg-transparent text-[11px] font-bold text-black dark:text-white cursor-pointer">
                    <option>Cash</option>
                    <option>Bank</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={handlePartial} className="py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-extrabold text-xs transition">
                    Save Partial
                  </button>
                  <button onClick={() => { setIsPartial(false); setPartialAmount(""); }} className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs transition">
                    Back
                  </button>
                </div>
              </div>
            ) : (
              /* RESCHEDULE WORKFLOW */
              <div className="flex flex-col gap-3">
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold text-left">Select new scheduled date:</p>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-green-500 text-xs text-black dark:text-white"
                />

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={handleReschedule} className="py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-extrabold text-xs transition">
                    Reschedule
                  </button>
                  <button onClick={() => { setIsRescheduling(false); setRescheduleDate(""); }} className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs transition">
                    Back
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

// ================= COMPONENT =================
function ProjectionBlock({ label, val, color, prefix = "" }: { label: string, val: number, color: string, prefix?: string }) {
  return (
    <div className="bg-slate-50/50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-900/60 p-3 sm:p-4 rounded-2xl flex flex-col text-left">
      <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-zinc-500 leading-normal">{label}</span>
      <span className={`text-sm sm:text-base font-black ${color} mt-1 truncate`}>
        {val > 0 ? prefix : ""}{val.toLocaleString("en-BD")} Tk
      </span>
    </div>
  );
}