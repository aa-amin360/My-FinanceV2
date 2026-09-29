"use client";

import { useEffect, useState } from "react";
import CloseButton from "@/frontend/components/atoms/CloseButton";
import ActionPicker from "@/frontend/components/organisms/ActionPicker";
import NewGoalForm from "@/frontend/components/organisms/NewGoalForm";
import TransactionForm, { TransactionFormPreset } from "@/frontend/components/organisms/TransactionForm";
import { categoriesApi } from "@/frontend/api/categories";
import { savingsApi } from "@/frontend/api/savings";
import {
  OPEN_TRANSACTION_MODAL_EVENT,
  requestRefresh,
  TransactionModalPreset,
  TransactionModalShortcut,
} from "@/frontend/lib/events";
import { ACTION_TITLES, ModalAction } from "@/frontend/lib/transactionActions";
import type { Category, SavingsGoal } from "@/shared/apiTypes";
import Presence from "@/frontend/components/atoms/Presence";

// Shortcuts that jump straight to a form
const SHORTCUT_ACTIONS: Partial<Record<TransactionModalShortcut, ModalAction>> = {
  DEBT: "BORROW",
  RECEIVABLE: "GIVE",
  NEW_GOAL: "NEW_GOAL",
};

// Global "add" dialog, opened from anywhere via openTransactionModal()
export default function TransactionModal() {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<ModalAction | null>(null);
  const [preset, setPreset] = useState<TransactionFormPreset>({});
  // Opened for a specific purpose (e.g. "Repay"): no way back to the action picker
  const [locked, setLocked] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);

  const close = () => {
    setOpen(false);
    setAction(null);
    setPreset({});
    setLocked(false);
    requestRefresh();
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<TransactionModalShortcut | TransactionModalPreset>).detail;

      setOpen(true);
      // Reload so newly created categories and goals are always available
      categoriesApi.list().then(setCategories).catch(() => {});
      savingsApi.list().then(setGoals).catch(() => {});

      if (typeof detail === "string") {
        const shortcut = SHORTCUT_ACTIONS[detail];
        setAction(shortcut ?? null);
        setLocked(!!shortcut);
        setPreset({});
        return;
      }

      setLocked(true);
      if (detail.type === "DEBT_REPAID" || detail.type === "RECEIVABLE_RECEIVED") {
        setAction(detail.type === "DEBT_REPAID" ? "REPAY" : "RECEIVE");
        setPreset({ entity: detail.entity || "" });
      } else if (detail.type === "TRANSFER") {
        setAction("TRANSFER");
        setPreset({
          direction: detail.direction || "TO_SAVINGS",
          goalId: detail.goalId ? detail.goalId.toString() : undefined,
          note: detail.goalName ? `Funding Goal: ${detail.goalName}` : undefined,
          amount: detail.amount ? String(Number(detail.amount)) : undefined,
        });
      }
    };

    window.addEventListener(OPEN_TRANSACTION_MODAL_EVENT, handler);
    return () => window.removeEventListener(OPEN_TRANSACTION_MODAL_EVENT, handler);
  }, []);

  return (
    <Presence show={open}>
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={close}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[340px] bg-gradient-to-br from-white to-slate-50 dark:from-[#0d1318] dark:to-[#080b0f] backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.06] text-black dark:text-white rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-modalIn relative"
      >
        {action === null ? (
          <ActionPicker onPick={setAction} onClose={close} />
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.04] pb-2">
              <h3 className="font-bold text-black dark:text-white text-base leading-none">{ACTION_TITLES[action]}</h3>
              <CloseButton onClick={close} />
            </div>

            {action === "NEW_GOAL" ? (
              <NewGoalForm onSuccess={close} onClose={close} />
            ) : (
              <TransactionForm
                key={action}
                action={action}
                preset={preset}
                categories={categories}
                goals={goals}
                locked={locked}
                onSaved={close}
                onBack={() => setAction(null)}
              />
            )}
          </>
        )}
      </div>
    </div>
    </Presence>
  );
}
