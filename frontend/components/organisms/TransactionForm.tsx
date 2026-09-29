"use client";

import { useState } from "react";
import ErrorText from "@/frontend/components/atoms/ErrorText";
import FieldLabel from "@/frontend/components/atoms/FieldLabel";
import FormInput from "@/frontend/components/atoms/FormInput";
import DirectionToggle, { TransferDirection } from "@/frontend/components/molecules/DirectionToggle";
import Dropdown from "@/frontend/components/molecules/Dropdown";
import { errorMessage } from "@/frontend/api/client";
import { NewTransaction, transactionsApi } from "@/frontend/api/transactions";
import {
  ACTION_TO_TYPE,
  CATEGORY_ACTIONS,
  COUNTERPARTY_ACTIONS,
  TransactionAction,
} from "@/frontend/lib/transactionActions";
import { ACCOUNT_OPTIONS, localDateString } from "@/shared/config";
import type { Category, SavingsGoal } from "@/shared/apiTypes";

// Values an opener can pre-fill (e.g. "Repay" from the debts page)
export type TransactionFormPreset = {
  entity?: string;
  direction?: TransferDirection;
  goalId?: string;
  note?: string;
  amount?: string;
};

type TransactionFormProps = {
  action: TransactionAction;
  preset: TransactionFormPreset;
  categories: Category[];
  goals: SavingsGoal[];
  // Opened for a specific purpose: the goal can't be changed and there is no Back button
  locked: boolean;
  onSaved: () => void;
  onBack: () => void;
};

// Amount, account and the fields specific to the chosen action
export default function TransactionForm({ action, preset, categories, goals, locked, onSaved, onBack }: TransactionFormProps) {
  const [amount, setAmount] = useState(preset.amount ?? "");
  const [account, setAccount] = useState("Cash");
  const [category, setCategory] = useState<number | "">("");
  const [entity, setEntity] = useState(preset.entity ?? "");
  const [note, setNote] = useState(preset.note ?? "");
  const [goalId, setGoalId] = useState(preset.goalId ?? "");
  const [direction, setDirection] = useState<TransferDirection>(preset.direction ?? "TO_SAVINGS");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const needsCategory = CATEGORY_ACTIONS.includes(action);
  const needsCounterparty = COUNTERPARTY_ACTIONS.includes(action);

  const handleSubmit = async () => {
    if (loading) return;
    setError("");

    const amountNumber = Number(amount);
    if (!amount || amountNumber <= 0 || isNaN(amountNumber)) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }
    if (needsCategory && !category) {
      setError("Select a category.");
      return;
    }
    if (needsCounterparty && !entity.trim()) {
      setError("Enter person or counterpart entity.");
      return;
    }

    setLoading(true);
    try {
      const body: NewTransaction = {
        type: ACTION_TO_TYPE[action],
        amount: amountNumber,
        account,
        date: localDateString(),
        note: note.trim() || null,
        direction: action === "TRANSFER" ? direction : null,
        savings_goal_id: action === "TRANSFER" && goalId ? parseInt(goalId) : null,
      };
      if (category) body.category_id = category;
      if (entity) body.entity = entity.trim();

      await transactionsApi.create(body);
      onSaved();
    } catch (err) {
      setError(errorMessage(err, "Transaction failed"));
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = categories.filter((c) => c.type === action).map((c) => ({ value: c.id, label: c.name }));
  const goalOptions = [{ value: "", label: "General Savings" }, ...goals.map((g) => ({ value: g.id.toString(), label: g.name }))];

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <FieldLabel>Amount</FieldLabel>
        <FormInput
          type="number"
          required
          min="0.01"
          step="any"
          placeholder="0.00"
          value={amount}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "" || Number(val) >= 0) setAmount(val);
          }}
        />
      </div>

      {action === "TRANSFER" && <DirectionToggle value={direction} onChange={setDirection} />}

      {action === "TRANSFER" && (
        <Dropdown
          label="Link to Goal"
          options={goalOptions}
          selectedValue={goalId}
          onChange={setGoalId}
          disabled={locked}
          placeholder="General Savings"
        />
      )}

      <Dropdown label="Account" options={ACCOUNT_OPTIONS} selectedValue={account} onChange={setAccount} />

      {needsCategory && (
        <Dropdown label="Category" options={categoryOptions} selectedValue={category} onChange={setCategory} placeholder="Select Category" />
      )}

      {needsCounterparty && (
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Counterparty</FieldLabel>
          <FormInput type="text" placeholder="Person / Bank (e.g. Rahim)" value={entity} onChange={(e) => setEntity(e.target.value)} />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Add Note (Optional)</FieldLabel>
        <FormInput type="text" placeholder="Add note..." value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <ErrorText message={error} />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 mt-2 rounded-xl bg-green-500 hover:bg-green-400 disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-black font-extrabold text-sm transition active:scale-95 shadow-md"
      >
        {loading ? "Saving..." : "Save"}
      </button>

      {!locked && (
        <button
          onClick={onBack}
          className="bg-black/[0.03] dark:bg-white/[0.03] hover:bg-black/[0.06] dark:hover:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.04] text-black dark:text-white py-3 rounded-xl transition text-xs sm:text-sm font-bold"
        >
          Back
        </button>
      )}
    </>
  );
}
