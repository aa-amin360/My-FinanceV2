"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useRefresh } from "@/hooks/useRefresh";
import AddPlanForm from "@/components/modal/AddPlanForm";
import ProcessPlanForm from "@/components/modal/ProcessPlanForm";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { 
  Plus, 
  Trash2, 
  X, 
  ChevronLeft, 
  ChevronRight,
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

  // Modal and process overlay managers
  const [showAddModal, setShowAddModal] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<Plan | null>(null);
  const [planToDeleteId, setPlanToDeleteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Load plans list and available ledger balances
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

  useEffect(() => {
    fetch("/api/categories")
      .then(res => res.json())
      .then(d => setCategories(d.data || []));
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() + 1, 1));
  };

  // Forecast summaries calculations
  let expectedIncome = 0;
  let expectedExpenses = 0;

  plans.forEach(p => {
    if (p.status !== "PENDING") return;
    const amt = Number(p.amount);
    if (p.type === "INCOME") expectedIncome += amt;
    if (p.type === "EXPENSE") expectedExpenses += amt;
  });

  const projectedPosition = currentBalance + expectedIncome - expectedExpenses;

  const handleDeletePlan = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/budget/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPlanToDeleteId(null);
        loadData();
      }
    } catch (err) {
      console.error("Failed to delete plan:", err);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeStyle = (pType: string) => {
    return pType === "INCOME" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 text-rose-600 dark:text-rose-400";
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 px-1 sm:px-4 pb-16 animate-fadeIn">
        
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">Budget Planning</h1>
            <p className="text-sm text-slate-500 dark:text-zinc-500">Plan ahead, schedule events, and forecast your actual projected month-end wealth.</p>
          </div>

          <div className="flex gap-2 items-center self-end sm:self-center">
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

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-bold text-xs sm:text-sm transition active:scale-95 flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm shadow-green-500/10"
            >
              <Plus size={16} /> Add Plan
            </button>
          </div>
        </div>

        {/* Projection summary widget */}
        <div className="bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] p-4 sm:p-6 rounded-3xl shadow-sm space-y-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.02)]">
          <h2 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">Projections for {monthName}</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 pt-1">
            <div className="col-span-2 sm:col-span-1">
              <ProjectionBlock label="Current Balance" val={currentBalance} color="text-zinc-700 dark:text-zinc-300"/>
            </div>
            <ProjectionBlock label="Expected Income" val={expectedIncome} color="text-emerald-500" prefix="+"/>
            <ProjectionBlock label="Expected Expenses" val={expectedExpenses} color="text-rose-500" prefix="-"/>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-black/[0.04] dark:border-white/[0.04] mt-2">
            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-zinc-400">Projected Month-End Position</span>
            <span className="text-base sm:text-xl font-bold text-emerald-500">
              {projectedPosition.toLocaleString("en-BD")} Tk
            </span>
          </div>
        </div>

        {/* Desktop List Layout */}
        <div className="hidden md:block bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] rounded-3xl overflow-hidden shadow-sm shadow-black/[0.01]">
          <div className="grid grid-cols-12 px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b border-black/[0.05] dark:border-white/[0.04] leading-none">
            <div className="col-span-3">Target</div>
            <div className="col-span-2">Expected Date</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-3">Note</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>

          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
            {plans.map((p) => {
              const amt = Number(p.amount);
              return (
                <div key={p.id} className="grid grid-cols-12 items-center px-5 py-4 hover:bg-white/35 dark:hover:bg-black/35 transition text-sm border-b border-black/[0.03] dark:border-white/[0.03]">
                  <div className="col-span-3 font-semibold text-black dark:text-white truncate">
                    {p.target_name}
                  </div>

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

                  <div className="col-span-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${getBadgeStyle(p.type)}`}>
                      {p.type}
                    </span>
                  </div>

                  <div className="col-span-3 text-xs text-slate-400 dark:text-zinc-500 truncate pr-4">
                    {p.note || "—"}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-3 text-right">
                    <span className="font-bold text-black dark:text-white shrink-0">
                      {amt.toLocaleString("en-BD")} Tk
                    </span>

                    {p.status === "PENDING" ? (
                      p.date.substring(0, 10) < new Date().toLocaleDateString("en-CA") ? (
                        <button
                          type="button"
                          onClick={() => setProcessingPlan(p)}
                          className="px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-400 text-white text-xs font-bold transition active:scale-95 shrink-0 shadow-sm"
                        >
                          Overdue
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setProcessingPlan(p)}
                          className="px-2.5 py-1 rounded-lg bg-green-500 text-black hover:bg-green-400 text-xs font-bold transition active:scale-95 shrink-0 shadow-sm"
                        >
                          Due
                        </button>
                      )
                    ) : (
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${p.status === "CONFIRMED" ? "text-emerald-500" : "text-zinc-500"} shrink-0`}>
                        {p.status}
                      </span>
                    )}

                    <button
                      type="button"
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

        {/* Mobile Grid Layout */}
        <div className="md:hidden space-y-3">
          {plans.map((p) => {
            const amt = Number(p.amount);
            return (
              <div 
                key={p.id} 
                className="bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md p-4 rounded-2xl shadow-sm shadow-black/[0.01] flex flex-col gap-3"
              >
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
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-black dark:text-white">{amt.toLocaleString("en-BD")} Tk</p>
                  </div>
                </div>

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
                          type="button"
                          onClick={() => setProcessingPlan(p)}
                          className="px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-400 text-white text-[10px] font-bold transition active:scale-95 shadow-sm"
                        >
                          Overdue
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setProcessingPlan(p)}
                          className="px-2.5 py-1 rounded-lg bg-green-500 text-black hover:bg-green-400 text-[10px] font-bold transition active:scale-95 shadow-sm"
                        >
                          Due
                        </button>
                      )
                    ) : (
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${p.status === "CONFIRMED" ? "text-emerald-500" : "text-zinc-500"}`}>
                        {p.status}
                      </span>
                    )}

                    <button
                      type="button"
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

      {/* Add Plan Modal (Consuming isolated AddPlanForm component) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="
              w-[380px]
              bg-gradient-to-br from-white to-slate-50
              dark:bg-gradient-to-br dark:from-[#0d1318] dark:to-[#080b0f]
              backdrop-blur-xl
              border border-black/[0.06] dark:border-white/[0.06]
              text-black dark:text-white
              rounded-3xl p-5 sm:p-6
              shadow-2xl flex flex-col gap-4
              animate-modalIn relative
            "
          >
            <div className="flex justify-between items-center border-b border-black/[0.04] dark:border-white/[0.04] pb-3">
              <h3 className="text-lg font-bold text-black dark:text-white leading-none">Create Budget Plan</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-black dark:hover:text-white transition rounded-full hover:bg-black/[0.03] dark:hover:bg-white/[0.03]">
                <X size={16} />
              </button>
            </div>

            <AddPlanForm
              categories={categories}
              onSuccess={() => {
                setShowAddModal(false);
                loadData();
              }}
              onClose={() => setShowAddModal(false)}
            />
          </div>
        </div>
      )}

      {/* Due event workflow decision overlay (Consuming isolated ProcessPlanForm component) */}
      {processingPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setProcessingPlan(null)}>
          <div 
            className="
              w-[360px]
              bg-gradient-to-br from-white to-slate-50
              dark:bg-gradient-to-br dark:from-[#0d1318] dark:to-[#080b0f]
              border border-black/[0.05] dark:border-white/[0.05] 
              text-black dark:text-white backdrop-blur-xl rounded-3xl 
              p-5 sm:p-6 text-center shadow-2xl flex flex-col gap-4 animate-modalIn
            " 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-black/[0.04] dark:border-white/[0.04] pb-3 flex justify-between items-center text-left">
              <div>
                <h3 className="text-base font-bold text-black dark:text-white leading-none">{processingPlan.target_name}</h3>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider block mt-1">
                  Due amount: {Number(processingPlan.amount).toLocaleString("en-BD")} Tk
                </span>
              </div>
              <button onClick={() => setProcessingPlan(null)} className="p-1 text-slate-400 hover:text-black dark:hover:text-white transition rounded-full hover:bg-black/[0.03] dark:hover:bg-white/[0.03]">
                <X size={14} />
              </button>
            </div>

            <ProcessPlanForm
              plan={processingPlan}
              onSuccess={() => {
                setProcessingPlan(null);
                loadData();
              }}
              onClose={() => setProcessingPlan(null)}
            />
          </div>
        </div>
      )}

      {/* Delete Plan Confirmation Modal using Global ConfirmDialog */}
      <ConfirmDialog
        isOpen={planToDeleteId !== null}
        onClose={() => setPlanToDeleteId(null)}
        onConfirm={() => planToDeleteId && handleDeletePlan(planToDeleteId)}
        title="Delete Planned Item?"
        description="Are you sure you want to permanently delete this planned item? This action cannot be undone."
        confirmText="Delete"
        loading={loading}
        variant="danger"
      />    
    </DashboardLayout>
  );
}

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