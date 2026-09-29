"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import ConfirmDialog from "@/frontend/components/molecules/ConfirmDialog";
import MonthNavigator from "@/frontend/components/molecules/MonthNavigator";
import PageHeader from "@/frontend/components/molecules/PageHeader";
import AddPlanModal from "@/frontend/components/organisms/AddPlanModal";
import BudgetProjection from "@/frontend/components/organisms/BudgetProjection";
import PlanList from "@/frontend/components/organisms/PlanList";
import ProcessPlanModal from "@/frontend/components/organisms/ProcessPlanModal";
import { useRefresh } from "@/frontend/hooks/useRefresh";
import { balanceApi } from "@/frontend/api/balance";
import { budgetApi } from "@/frontend/api/budget";
import { categoriesApi } from "@/frontend/api/categories";
import { formatMonthYear } from "@/frontend/lib/format";
import { sumMoney } from "@/shared/money";
import type { BudgetPlan, Category } from "@/shared/apiTypes";
import Presence from "@/frontend/components/atoms/Presence";

export default function BudgetScreen() {
  const [plans, setPlans] = useState<BudgetPlan[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [categories, setCategories] = useState<Category[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<BudgetPlan | null>(null);
  const [planToDeleteId, setPlanToDeleteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const monthName = formatMonthYear(currentDate);

  // Plans for the visible month and the current spendable balance
  const loadData = async () => {
    try {
      const [balances, monthPlans] = await Promise.all([balanceApi.get(), budgetApi.list(month, year)]);
      setCurrentBalance(balances.balance);
      setPlans(monthPlans);
    } catch (err) {
      console.error("Failed to load budget planning data:", err);
    } finally {
      setLoaded(true);
    }
  };

  useRefresh(loadData, { runOnMount: false });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => {});
  }, []);

  const shiftMonth = (delta: number) => setCurrentDate(new Date(year, currentDate.getMonth() + delta, 1));

  // Forecast from plans that haven't been processed yet
  const pendingPlans = plans.filter((p) => p.status === "PENDING");
  const expectedIncome = sumMoney(pendingPlans.filter((p) => p.type === "INCOME").map((p) => p.amount));
  const expectedExpenses = sumMoney(pendingPlans.filter((p) => p.type === "EXPENSE").map((p) => p.amount));
  const projectedPosition = sumMoney([currentBalance, expectedIncome, -expectedExpenses]);

  const handleDeletePlan = async (id: number) => {
    setLoading(true);
    try {
      await budgetApi.remove(id);
      setPlanToDeleteId(null);
      loadData();
    } catch (err) {
      console.error("Failed to delete plan:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full space-y-6 px-1 sm:px-4 pb-16">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <PageHeader
            title="Budget Planning"
            subtitle="Plan ahead, schedule events, and forecast your actual projected month-end wealth."
          />

          <div className="flex gap-2 items-center self-end sm:self-center">
            <MonthNavigator label={monthName} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} />

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-bold text-xs sm:text-sm transition active:scale-95 flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm shadow-green-500/10"
            >
              <Plus size={16} /> Add Plan
            </button>
          </div>
        </div>

        <BudgetProjection
          monthName={monthName}
          currentBalance={currentBalance}
          expectedIncome={expectedIncome}
          expectedExpenses={expectedExpenses}
          projectedPosition={projectedPosition}
        />

        <PlanList plans={plans} monthName={monthName} onProcess={setProcessingPlan} onDelete={setPlanToDeleteId} loaded={loaded} />
      </div>

      <Presence show={showAddModal}>
        <AddPlanModal
          categories={categories}
          onCategoryCreated={(category) => setCategories((prev) => [...prev, category])}
          onSuccess={() => {
            setShowAddModal(false);
            loadData();
          }}
          onClose={() => setShowAddModal(false)}
        />
      </Presence>

      <Presence show={!!processingPlan}>
        {processingPlan && (
        <ProcessPlanModal
          plan={processingPlan}
          onSuccess={() => {
            setProcessingPlan(null);
            loadData();
          }}
          onClose={() => setProcessingPlan(null)}
        />
        )}
      </Presence>

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
    </>
  );
}
