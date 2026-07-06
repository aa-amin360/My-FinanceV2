"use client";

import { useEffect, useState, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useRefresh } from "@/hooks/useRefresh";
import { 
  Plus, 
  Trash2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle,
  CheckCircle2,
  ArrowRightLeft,
  Save
} from "lucide-react";

type Plan = {
  id: number;
  type: "EXPENSE" | "INCOME";
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
  
  const [categories, setCategories] = useState<Category[]>([]);

  // Modals & Forms State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickCategoryModal, setShowQuickCategoryModal] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<Plan | null>(null);
  const [planToDeleteId, setPlanToDeleteId] = useState<number | null>(null);

  // Form inputs
  const [date, setDate] = useState("");
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [targetSearch, setTargetSearch] = useState("");
  const [selectedTarget, setSelectedDateTarget] = useState<{ id: string | null; name: string } | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [showTargetDropdown, setShowTargetDropdown] = useState(false);

  // Custom Mini Calendar Picker States
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(() => new Date());

  const [showReschedulePicker, setShowReschedulePicker] = useState(false);
  const [reschedulePickerDate, setReschedulePickerDate] = useState(() => new Date());

  // Process Modal Inputs
  const [processAccount, setAccount] = useState("Cash");
  const [partialAmount, setPartialAmount] = useState("");
  const [isPartial, setIsPartial] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // ==========================================
  // REFERENCE HOOKS (For Click Outside Detection)
  // ==========================================
  const autocompleteRef = useRef<HTMLDivElement | null>(null);
  const datePickerRef = useRef<HTMLDivElement | null>(null);
  const reschedulePickerRef = useRef<HTMLDivElement | null>(null);

  // ==========================================
  // CUSTOM DATE PICKER HELPERS
  // ==========================================
  const getPickerGridCells = (viewDate: Date) => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const totalDays = new Date(y, m + 1, 0).getDate();
    const firstDayIndex = new Date(y, m, 1).getDay();
    const padding = Array.from({ length: firstDayIndex }, () => null);
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    return [...padding, ...days];
  };

  const isPastDay = (day: number, viewDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const checkDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    return checkDate < today;
  };

  // ==========================================
  // LOAD PLANS AND LEDGER STATUS
  // ==========================================
  const loadData = async () => {
    try {
      const balRes = await fetch("/api/balance", { cache: "no-store" });
      const balJson = await balRes.json();
      setCurrentBalance(Number(balJson.balance || 0));

      const planRes = await fetch(`/api/budget?month=${month}&year=${year}`, { cache: "no-store" });
      const planJson = await planRes.json();
      setPlans(planJson.data || []);
    } catch (err) {
      console.error("Failed to load budget planning data:", err);
    }
  };

  useRefresh(loadData);

  useEffect(() => {
    loadData();
  }, [currentDate]);

  // Optimized: Only fetch categories on mount
  useEffect(() => {
    fetch("/api/categories")
      .then(res => res.json())
      .then(d => setCategories(d.data || []));
  }, []);

  // ==========================================
  // CLICK OUTSIDE DETECTOR LISTENER
  // ==========================================
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowTargetDropdown(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
      if (reschedulePickerRef.current && !reschedulePickerRef.current.contains(e.target as Node)) {
        setShowReschedulePicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() + 1, 1));
  };

  // Autocomplete filtered categories lookup
  const getFilteredSuggestions = () => {
    const cleanQuery = targetSearch.trim().toLowerCase();
    const filtered = categories.filter(c => c.type === type);
    if (!cleanQuery) return filtered;
    return filtered.filter(c => c.name.toLowerCase().includes(cleanQuery));
  };

  const suggestions = getFilteredSuggestions();
  const showCreateCategoryTrigger = 
    targetSearch.trim() !== "" && 
    !suggestions.some(s => s.name.toLowerCase() === targetSearch.trim().toLowerCase());

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

  plans.forEach(p => {
    if (p.status !== "PENDING") return;
    const amt = Number(p.amount);
    if (p.type === "INCOME") expectedIncome += amt;
    if (p.type === "EXPENSE") expectedExpenses += amt;
  });

  const projectedPosition = currentBalance + expectedIncome - expectedExpenses;

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

    const amountNumber = Number(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      setError("Amount must be a positive number greater than 0.");
      setLoading(false);
      return;
    }

    const todayStr = new Date().toLocaleDateString("en-CA");
    if (date < todayStr) {
      setError("Scheduled date cannot be in the past.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: amountNumber,
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

  const handleConfirm = async (amtToConfirm = Number(processingPlan?.amount)) => {
    if (!processingPlan) return;
    setLoading(true);
    setError("");

    try {
      const txPayload: any = {
        type: processingPlan.type,
        amount: amtToConfirm,
        account: processAccount,
        date: new Date().toLocaleDateString("en-CA"),
        note: processingPlan.note ? `${processingPlan.note} (Planned)` : "Planned event confirmed",
        category_id: processingPlan.target_id
      };

      const txRes = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txPayload),
      });

      if (!txRes.ok) {
        const errData = await txRes.json();
        throw new Error(errData.error || "Failed to create transaction.");
      }

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
      const txPayload: any = {
        type: processingPlan.type,
        amount: partialAmt,
        account: processAccount,
        date: new Date().toLocaleDateString("en-CA"),
        note: processingPlan.note ? `${processingPlan.note} (Partial planned)` : "Partial planned event",
        category_id: processingPlan.target_id
      };

      const txRes = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txPayload),
      });

      if (!txRes.ok) {
        const errData = await txRes.json();
        throw new Error(errData.error || "Failed to create transaction.");
      }

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
      setShowReschedulePicker(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (id: number) => {
    try {
      const res = await fetch(`/api/budget/${id}`, { method: "DELETE" });
      if (res.ok) loadData();
    } catch (err) {
      console.error("Failed to delete plan:", err);
    }
  };

  const getBadgeStyle = (type: string) => {
    return type === "INCOME" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500";
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 px-1 sm:px-4 pb-16">
        
        {/* HEADER CONTROLS */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">Budget Planning</h1>
            <p className="text-sm text-slate-500 dark:text-zinc-500">Plan ahead, schedule events, and forecast your actual projected month-end wealth.</p>
          </div>

          <div className="flex gap-2 items-center self-end sm:self-center">
            {/* Month Switches */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-inner">
              <button onClick={handlePrevMonth} className="p-2 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition text-zinc-500 hover:text-black dark:hover:text-white active:scale-95">
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs sm:text-sm font-bold text-black dark:text-white px-2 min-w-[110px] text-center">
                {monthName}
              </span>
              <button onClick={handleNextMonth} className="p-2 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition text-zinc-500 hover:text-black dark:hover:text-white active:scale-95">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Add Plan Trigger */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-bold text-xs sm:text-sm transition active:scale-95 flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm shadow-green-500/10"
            >
              <Plus size={16} /> Add Plan
            </button>
          </div>
        </div>

        {/* ==========================================
            FINANCIAL FORECASTING SUMMARY CARD (GLASS)
            ========================================== */}
        {/* ✅ Updated to standard translucent glassmorphic panel */}
        <div className="bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md p-4 sm:p-6 rounded-3xl shadow-sm space-y-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.02)]">
          <h2 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">Projections for {monthName}</h2>
          
          {/* Mobile: Current Balance full width, Income/Expense side by side */}
          {/* Desktop: Original 3-column layout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 pt-1">
            <div className="col-span-2 sm:col-span-1">
              <ProjectionBlock label="Current Balance" val={currentBalance} color="text-zinc-700 dark:text-zinc-300"/>
            </div>
            <ProjectionBlock label="Expected Income" val={expectedIncome} color="text-green-500" prefix="+"/>
            <ProjectionBlock label="Expected Expenses" val={expectedExpenses} color="text-red-500" prefix="-"/>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-zinc-900/60 mt-2">
            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-zinc-400">Projected Month-End Position</span>
            {/* ✅ Updated text color to premium emerald green */}
            <span className="text-base sm:text-xl font-bold text-emerald-500">
              {projectedPosition.toLocaleString("en-BD")} Tk
            </span>
          </div>
        </div>

        {/* ==========================================
            PLANNED ITEMS LISTING (SPLIT LAYOUT)
            ========================================== */}
        
        {/* DESKTOP TABLE VIEW (GLASS CONTAINER) */}
        {/* ✅ Updated to standard translucent glassmorphic panel */}
        <div className="hidden md:block bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md rounded-3xl overflow-hidden shadow-sm shadow-black/[0.01]">
          {/* HEADER */}
          <div className="grid grid-cols-12 px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b border-black/[0.05] dark:border-white/[0.04] leading-none">
            <div className="col-span-3">Target</div>
            <div className="col-span-2">Expected Date</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-3">Note</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>

          {/* LIST */}
          <div className="divide-y divide-slate-100 dark:divide-zinc-900/60">
            {plans.map((p) => {
              const amt = Number(p.amount);
              return (
                // ✅ Updated table rows to clean translucent glass hover effects
                <div key={p.id} className="grid grid-cols-12 items-center px-5 py-4 hover:bg-white/35 dark:hover:bg-black/35 transition text-sm border-b border-black/[0.03] dark:border-white/[0.03]">
                  
                  {/* Target Name */}
                  <div className="col-span-3 font-semibold text-black dark:text-white truncate">
                    {p.target_name}
                  </div>

                  {/* Date (With pulsing warning indicator if overdue) */}
                  <div className="col-span-2 text-xs text-slate-500 dark:text-zinc-500 flex items-center gap-1.5">
                    <span>
                      {new Date(p.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      })}
                    </span>
                    {p.status === "PENDING" && p.date.substring(0, 10) < new Date().toLocaleDateString("en-CA") && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" title="Overdue!" />
                    )}
                  </div>

                  {/* Type */}
                  <div className="col-span-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${getBadgeStyle(p.type)}`}>
                      {p.type}
                    </span>
                  </div>

                  {/* Note */}
                  <div className="col-span-3 text-xs text-slate-400 dark:text-zinc-500 truncate pr-4">
                    {p.note || "—"}
                  </div>

                  {/* Amount / Action Controls */}
                  <div className="col-span-2 flex items-center justify-end gap-3 text-right">
                    <span className="font-bold text-black dark:text-white shrink-0">
                      {amt.toLocaleString("en-BD")} Tk
                    </span>

                    {p.status === "PENDING" ? (
                      p.date.substring(0, 10) < new Date().toLocaleDateString("en-CA") ? (
                        <button
                          onClick={() => setProcessingPlan(p)}
                          className="px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-400 text-white text-xs font-bold transition active:scale-95 shrink-0 shadow-sm"
                        >
                          Overdue
                        </button>
                      ) : (
                        <button
                          onClick={() => setProcessingPlan(p)}
                          className="px-2.5 py-1 rounded-lg bg-green-500 text-black hover:bg-green-400 text-xs font-bold transition active:scale-95 shrink-0 shadow-sm"
                        >
                          Due
                        </button>
                      )
                    ) : (
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${p.status === "CONFIRMED" ? "text-green-500" : "text-zinc-500"} shrink-0`}>
                        {p.status}
                      </span>
                    )}

                    <button
                      onClick={() => setPlanToDeleteId(p.id)}
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

        {/* MOBILE CARD VIEW (GLASS CARDS) */}
        <div className="md:hidden space-y-3">
          {plans.map((p) => {
            const amt = Number(p.amount);
            return (
              // ✅ Updated cards to standard translucent glassmorphic style
              <div 
                key={p.id} 
                className="bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md p-4 rounded-2xl shadow-sm shadow-black/[0.01] flex flex-col gap-3"
              >
                {/* Row 1: Target and Amount */}
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-black dark:text-white truncate">{p.target_name}</p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1.5">
                      <span>
                        {new Date(p.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          timeZone: "UTC",
                        })}
                      </span>
                      {p.status === "PENDING" && p.date.substring(0, 10) < new Date().toLocaleDateString("en-CA") && (
                        <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse shrink-0" />
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-black dark:text-white">{amt.toLocaleString("en-BD")} Tk</p>
                  </div>
                </div>

                {/* Row 2: Type, Notes and Action Button */}
                <div className="flex justify-between items-center gap-3 pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase shrink-0 ${getBadgeStyle(p.type)}`}>
                      {p.type}
                    </span>
                    {p.note && (
                      <span className="text-[11px] text-slate-400 dark:text-zinc-500 truncate max-w-[140px]">
                        {p.note}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {p.status === "PENDING" ? (
                      p.date.substring(0, 10) < new Date().toLocaleDateString("en-CA") ? (
                        <button
                          onClick={() => setProcessingPlan(p)}
                          className="px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-400 text-white text-[10px] font-bold transition active:scale-95 shadow-sm"
                        >
                          Overdue
                        </button>
                      ) : (
                        <button
                          onClick={() => setProcessingPlan(p)}
                          className="px-2.5 py-1 rounded-lg bg-green-500 text-black hover:bg-green-400 text-[10px] font-bold transition active:scale-95 shadow-sm"
                        >
                          Due
                        </button>
                      )
                    ) : (
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${p.status === "CONFIRMED" ? "text-green-500" : "text-zinc-500"}`}>
                        {p.status}
                      </span>
                    )}

                    <button
                      onClick={() => setPlanToDeleteId(p.id)}
                      className="p-1 rounded-lg text-red-400 hover:bg-red-500/10 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
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

      {/* ==========================================
          ADD PLAN MODAL & SEARCH DROPDOWN (GLASS)
          ========================================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          {/* ✅ Updated modal wrapper to heavy frosted glassmorphism */}
          <div className="bg-white/75 dark:bg-black/60 border border-black/[0.05] dark:border-white/[0.05] text-black dark:text-white backdrop-blur-xl rounded-3xl p-5 sm:p-6 w-full max-w-[380px] shadow-2xl flex flex-col gap-4 animate-modalIn relative" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex justify-between items-center border-b border-black/[0.04] dark:border-white/[0.04] pb-3">
              <h3 className="text-lg font-bold text-black dark:text-white">Create Budget Plan</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-black dark:hover:text-white transition rounded-full hover:bg-black/[0.03] dark:hover:bg-white/[0.03]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="flex flex-col gap-3">
              {/* Type Select */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Planning Type</label>
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value as any);
                    setSelectedDateTarget(null);
                    setTargetSearch("");
                  }}
                  className="px-3 py-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-xs sm:text-sm text-black dark:text-white cursor-pointer"
                >
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
              </div>

              {/* Autocomplete Target Search Selector */}
              <div ref={autocompleteRef} className="flex flex-col gap-1 relative"> {/* ✅ Assigned ref here */}
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  {type === "EXPENSE" ? "Expense Category" : "Income Category"}
                </label>
                
                <input
                  type="text"
                  required
                  placeholder="Search Category..."
                  value={targetSearch}
                  onFocus={() => setShowTargetDropdown(true)}
                  onChange={(e) => {
                    setTargetSearch(e.target.value);
                    setSelectedDateTarget(null);
                    setShowTargetDropdown(true);
                  }}
                  className="px-3 py-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-xs sm:text-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:bg-white dark:focus:bg-zinc-950 transition-all duration-200"
                />

                {/* Autocomplete dropdown suggestions */}
                {showTargetDropdown && (
                  <div className="absolute top-full left-0 w-full mt-1.5 max-h-40 overflow-y-auto bg-white dark:bg-zinc-950 border border-black/[0.05] dark:border-white/[0.05] rounded-2xl shadow-xl z-50 flex flex-col divide-y divide-slate-100 dark:divide-zinc-900">
                    {suggestions.map((s, idx) => {
                      const nameStr = s.name;
                      const idStr = s.id;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedDateTarget({ id: idStr, name: nameStr });
                            setTargetSearch(nameStr);
                            setShowTargetDropdown(false);
                          }}
                          className="px-4 py-2.5 text-left text-xs font-semibold hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition text-slate-700 dark:text-zinc-300"
                        >
                          {nameStr}
                        </button>
                      );
                    })}

                    {/* Quick Create Category Modal trigger */}
                    {showCreateCategoryTrigger && (
                      <button
                        type="button"
                        onClick={() => setShowQuickCategoryModal(true)}
                        className="px-4 py-3 text-left text-xs font-semibold text-green-500 hover:bg-green-500/10 transition leading-normal border-t border-black/[0.05] dark:border-white/[0.04]"
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

              {/* Amount input (Protected against negative values, Spinners Hidden) */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Amount</label>
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
                  className="px-3 py-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-xs sm:text-sm text-black dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {/* Custom Mini Calendar Date Picker */}
              <div ref={datePickerRef} className="relative flex flex-col gap-1"> {/* ✅ Assigned ref here */}
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Scheduled Date</label>
                <div
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="px-3 py-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-xs sm:text-sm text-slate-500 dark:text-zinc-400 cursor-pointer flex justify-between items-center"
                >
                  <span>
                    {date 
                      ? new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) 
                      : "Select expected date..."
                    }
                  </span>
                  <span className="text-zinc-400">📅</span>
                </div>

                {/* Floating Custom Mini Calendar Dropdown */}
                {showDatePicker && (
                  <div className="absolute top-full left-0 w-full mt-1.5 p-3 bg-white dark:bg-zinc-950 border border-black/[0.04] dark:border-white/[0.04] rounded-2xl shadow-xl z-50 flex flex-col gap-2 animate-modalIn" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex justify-between items-center text-[11px] font-bold text-black dark:text-white leading-none">
                      <button type="button" onClick={() => setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() - 1, 1))} className="p-1 rounded hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition">
                        <ChevronLeft size={12} />
                      </button>
                      <span>{pickerDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                      <button type="button" onClick={() => setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() + 1, 1))} className="p-1 rounded hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition">
                        <ChevronRight size={12} />
                      </button>
                    </div>

                    {/* Weekdays */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[8px] font-bold text-zinc-400">
                      {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}
                    </div>

                    {/* Grid Days */}
                    <div className="grid grid-cols-7 gap-1">
                      {getPickerGridCells(pickerDate).map((day, idx) => {
                        if (day === null) {
                          return <div key={`empty-${idx}`} className="aspect-square" />;
                        }
                        
                        const isPast = isPastDay(day, pickerDate);
                        const isSelected = date === `${pickerDate.getFullYear()}-${(pickerDate.getMonth() + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

                        return (
                          <button
                            key={day}
                            type="button"
                            disabled={isPast}
                            onClick={() => {
                              const y = pickerDate.getFullYear();
                              const m = (pickerDate.getMonth() + 1).toString().padStart(2, "0");
                              const d = day.toString().padStart(2, "0");
                              setDate(`${y}-${m}-${d}`);
                              setShowDatePicker(false);
                            }}
                            className={`
                              aspect-square text-[9px] font-bold rounded-lg transition-all flex items-center justify-center
                              ${isPast 
                                ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed opacity-50" 
                                : isSelected
                                ? "bg-green-500 text-black shadow-sm"
                                : "text-slate-700 dark:text-zinc-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                              }
                            `}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Note */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Add Note (Optional)</label>
                <input
                  type="text"
                  placeholder="Add note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-xs sm:text-sm text-black dark:text-white"
                />
              </div>

              {error && <div className="text-xs text-red-500 font-bold text-center leading-normal">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 rounded-xl bg-green-500 hover:bg-green-400 disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-black font-bold text-xs sm:text-sm transition active:scale-95 shadow-md"
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
          <div className="bg-white/75 dark:bg-black/60 border border-black/[0.05] dark:border-white/[0.05] text-black dark:text-white backdrop-blur-xl rounded-3xl p-6 w-full max-w-[340px] text-center shadow-2xl flex flex-col gap-4 animate-modalIn">
            <h3 className="text-lg font-bold text-black dark:text-white">Create Category</h3>
            
            <div className="text-left space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-500">Category Name</label>
                <input
                  type="text"
                  disabled
                  value={targetSearch}
                  className="px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-transparent text-sm font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-500">Category Type</label>
                <input
                  type="text"
                  disabled
                  value={type}
                  className="px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-transparent text-sm font-semibold"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setProcessingPlan(null); setIsPartial(false); setIsRescheduling(false); setShowReschedulePicker(false); }}>
          {/* ✅ Updated modal wrapper to heavy frosted glassmorphism */}
          <div className="bg-white/75 dark:bg-black/60 border border-black/[0.05] dark:border-white/[0.05] text-black dark:text-white backdrop-blur-xl rounded-3xl p-5 sm:p-6 w-full max-w-[360px] text-center shadow-2xl flex flex-col gap-4 animate-modalIn" onClick={(e) => e.stopPropagation()}>
            
            <div className="border-b border-black/[0.04] dark:border-white/[0.04] pb-3 flex justify-between items-center text-left">
              <div>
                <h3 className="text-base font-bold text-black dark:text-white leading-none">{processingPlan.target_name}</h3>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider block mt-1">
                  Due amount: {Number(processingPlan.amount).toLocaleString("en-BD")} Tk
                </span>
              </div>
              <button onClick={() => { setProcessingPlan(null); setIsPartial(false); setIsRescheduling(false); setShowReschedulePicker(false); }} className="p-1 text-slate-400 hover:text-black dark:hover:text-white transition rounded-full hover:bg-black/[0.03] dark:hover:bg-white/[0.03]">
                <X size={14} />
              </button>
            </div>

            {error && <div className="text-xs text-red-500 font-bold leading-normal">{error}</div>}

            {!isPartial && !isRescheduling ? (
              <div className="flex flex-col gap-2.5">
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-normal">How do you want to handle this scheduled event?</p>
                
                {/* Account Method picker for Confirmations */}
                <div className="flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] p-2.5 rounded-xl">
                  <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">Account</span>
                  <select value={processAccount} onChange={(e) => setAccount(e.target.value)} className="bg-transparent text-xs font-bold text-black dark:text-white focus:outline-none cursor-pointer">
                    <option>Cash</option>
                    <option>Bank</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={() => handleConfirm()} className="py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-xs sm:text-sm transition">
                    Confirm
                  </button>
                  <button onClick={() => setIsPartial(true)} className="py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 font-bold text-xs sm:text-sm border border-blue-500/20 transition">
                    Partial
                  </button>
                  <button onClick={() => setIsRescheduling(true)} className="py-2.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 font-bold text-xs sm:text-sm border border-yellow-500/20 transition">
                    Reschedule
                  </button>
                  <button onClick={handleSkip} className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs sm:text-sm border border-transparent dark:border-zinc-800/80 transition">
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
                  className="px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-xs text-black dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />

                <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900/60 p-2 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">Account</span>
                  <select value={processAccount} onChange={(e) => setAccount(e.target.value)} className="bg-transparent text-[11px] font-bold text-black dark:text-white cursor-pointer">
                    <option>Cash</option>
                    <option>Bank</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={handlePartial} className="py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-xs sm:text-sm transition">
                    Save Partial
                  </button>
                  <button onClick={() => { setIsPartial(false); setPartialAmount(""); }} className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs sm:text-sm transition">
                    Back
                  </button>
                </div>
              </div>
            ) : (
              /* RESCHEDULE WORKFLOW */
              <div className="flex flex-col gap-3">
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold text-left">Select new scheduled date:</p>
                
                {/* ✅ Assigned ref={reschedulePickerRef} here */}
                <div ref={reschedulePickerRef} className="relative flex flex-col text-left">
                  <div
                    onClick={() => setShowReschedulePicker(!showReschedulePicker)}
                    className="px-3 py-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] text-xs text-black dark:text-white cursor-pointer flex justify-between items-center"
                  >
                    <span>
                      {rescheduleDate 
                        ? new Date(rescheduleDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) 
                        : "Select new date..."
                      }
                    </span>
                    <span className="text-zinc-400">📅</span>
                  </div>

                  {/* Reschedule Mini Calendar Dropdown */}
                  {showReschedulePicker && (
                    <div className="absolute bottom-full left-0 w-full mb-1.5 p-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 flex flex-col gap-2 animate-modalIn" onClick={(e) => e.stopPropagation()}>
                      {/* Header */}
                      <div className="flex justify-between items-center text-[11px] font-bold text-black dark:text-white leading-none">
                        <button type="button" onClick={() => setReschedulePickerDate(new Date(reschedulePickerDate.getFullYear(), reschedulePickerDate.getMonth() - 1, 1))} className="p-1 rounded hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition">
                          <ChevronLeft size={12} />
                        </button>
                        <span>{reschedulePickerDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                        <button type="button" onClick={() => setReschedulePickerDate(new Date(reschedulePickerDate.getFullYear(), reschedulePickerDate.getMonth() + 1, 1))} className="p-1 rounded hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition">
                          <ChevronRight size={12} />
                        </button>
                      </div>

                      {/* Weekdays */}
                      <div className="grid grid-cols-7 gap-1 text-center text-[8px] font-bold text-zinc-400">
                        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}
                      </div>

                      {/* Grid Days */}
                      <div className="grid grid-cols-7 gap-1">
                        {getPickerGridCells(reschedulePickerDate).map((day, idx) => {
                          if (day === null) {
                            return <div key={`empty-${idx}`} className="aspect-square" />;
                          }
                          
                          const isPast = isPastDay(day, reschedulePickerDate);
                          const isSelected = rescheduleDate === `${reschedulePickerDate.getFullYear()}-${(reschedulePickerDate.getMonth() + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

                          return (
                            <button
                              key={day}
                              type="button"
                              disabled={isPast}
                              onClick={() => {
                                const y = reschedulePickerDate.getFullYear();
                                const m = (reschedulePickerDate.getMonth() + 1).toString().padStart(2, "0");
                                const d = day.toString().padStart(2, "0");
                                setRescheduleDate(`${y}-${m}-${d}`);
                                setShowReschedulePicker(false);
                              }}
                              className={`
                                aspect-square text-[9px] font-bold rounded-lg transition-all flex items-center justify-center
                                ${isPast 
                                  ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed opacity-50" 
                                  : isSelected
                                  ? "bg-green-500 text-black shadow-sm"
                                  : "text-slate-700 dark:text-zinc-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                                }
                              `}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={handleReschedule} className="py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-xs sm:text-sm transition">
                    Reschedule
                  </button>
                  <button onClick={() => { setIsRescheduling(false); setRescheduleDate(""); setShowReschedulePicker(false); }} className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs sm:text-sm transition">
                    Back
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ==========================================
          ✅ GORGEOUS CUSTOM DELETE CONFIRMATION MODAL 
          ========================================== */}
      {planToDeleteId && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
          onClick={() => setPlanToDeleteId(null)}
        >
          <div 
            className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-[320px] text-center shadow-2xl flex flex-col gap-4 animate-modalIn" 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-black dark:text-white">Delete Planned Item?</h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              Are you sure you want to permanently delete this planned item? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center mt-2">
              <button
                onClick={() => handleDeletePlan(planToDeleteId)}
                className="px-5 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition active:scale-95 shadow-md"
              >
                Delete
              </button>
              <button
                onClick={() => setPlanToDeleteId(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold text-sm transition"
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

// ================= COMPONENT =================
function ProjectionBlock({ label, val, color, prefix = "" }: { label: string, val: number, color: string, prefix?: string }) {
  return (
    <div className="bg-slate-50/50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-900/60 p-3 sm:p-5 rounded-2xl flex flex-col text-left shadow-[inset_0_2px_4px_rgba(0,0,0,0.015)] dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.015)] w-full overflow-hidden">
      <span className="text-[11px] sm:text-xs md:text-sm font-semibold text-slate-400 dark:text-zinc-500 leading-tight truncate">{label}</span>
      <span className={`text-sm sm:text-lg md:text-xl lg:text-2xl font-bold ${color} mt-1.5 whitespace-nowrap`}>
        {val > 0 ? prefix : ""}{val.toLocaleString("en-BD")} Tk
      </span>
    </div>
  );
}