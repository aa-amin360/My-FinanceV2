"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

type EntryRow = {
  name: string;
  amount: string;
};

type ReceivableSetupGridProps = {
  onChange: (validReceivables: { name: string; amount: number }[]) => void;
};

export default function ReceivableSetupGrid({ onChange }: ReceivableSetupGridProps) {
  const [receivables, setReceivables] = useState<EntryRow[]>([{ name: "", amount: "" }]);
  const [bulkText, setBulkText] = useState("");

  // Propagate validated receivable logs back to the parent state whenever inputs change
  useEffect(() => {
    const validReceivables = receivables
      .filter((r) => r.name.trim() && Number(r.amount) > 0)
      .map((r) => ({
        name: r.name.trim(),
        amount: Number(r.amount),
      }));
    onChange(validReceivables);
  }, [receivables, onChange]);

  // Bulk paste parser logic to break text format (Name Amount) into structured rows
  const parseBulkText = (text: string): EntryRow[] => {
    const lines = text.split("\n");
    const parsed: EntryRow[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const lastSpaceIndex = trimmed.lastIndexOf(" ");
      if (lastSpaceIndex === -1) continue;

      const name = trimmed.substring(0, lastSpaceIndex).trim();
      const amountStr = trimmed.substring(lastSpaceIndex + 1).trim();
      const amountNum = Number(amountStr);

      if (name && !isNaN(amountNum) && amountNum > 0) {
        parsed.push({ name, amount: amountStr });
      }
    }
    return parsed;
  };

  const handleBulkParse = () => {
    const parsed = parseBulkText(bulkText);
    if (parsed.length === 0) {
      alert("No valid entries found. Format: Name Amount (e.g. Rahim 5000)");
      return;
    }

    const currentActive = receivables.filter((r) => r.name || r.amount);
    setReceivables([...currentActive, ...parsed]);
    setBulkText("");
  };

  const addRow = () => {
    setReceivables([...receivables, { name: "", amount: "" }]);
  };

  const removeRow = (index: number) => {
    const updated = receivables.filter((_, i) => i !== index);
    setReceivables(updated.length === 0 ? [{ name: "", amount: "" }] : updated);
  };

  const updateRow = (index: number, field: "name" | "amount", value: string) => {
    const updated = [...receivables];
    updated[index][field] = value;
    setReceivables(updated);
  };

  return (
    <div className="space-y-4">
      {/* Manual Rows */}
      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
        {receivables.map((row, index) => (
          <div key={index} className="flex gap-1.5 sm:gap-2 items-center w-full">
            <input
              type="text"
              placeholder="Name (e.g. Rahim)"
              value={row.name}
              onChange={(e) => updateRow(index, "name", e.target.value)}
              className="flex-grow min-w-0 px-2.5 sm:px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm focus:bg-white dark:focus:bg-zinc-950 transition-all duration-200 text-sm text-black dark:text-white"
            />
            <input
              type="number"
              placeholder="Amount"
              value={row.amount}
              onChange={(e) => updateRow(index, "amount", e.target.value)}
              className="w-20 sm:w-32 px-2 sm:px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:bg-white dark:focus:bg-zinc-950 transition-all duration-200 text-sm shrink-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-red-500 hover:bg-red-500/10 transition shrink-0"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Add Row Button */}
      <button
        type="button"
        onClick={addRow}
        className="self-start flex items-center gap-1.5 text-xs font-bold text-green-500 hover:text-green-400 transition"
      >
        <Plus size={14} /> Add Row
      </button>

      {/* Bulk Paste Area */}
      <div className="pt-2 border-t border-black/[0.05] dark:border-white/[0.05] space-y-2">
        <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
          Paste Multiple Receivables (Format: Name Amount)
        </label>
        <textarea
          placeholder={"Rahim 8000\nKarim 3000\nHasan 12000"}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          className="w-full h-20 px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] focus:bg-white dark:focus:bg-zinc-950 transition-all duration-200 text-sm resize-none font-mono text-black dark:text-white"
        />
        <button
          type="button"
          onClick={handleBulkParse}
          className="px-3 py-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] text-xs font-bold hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition"
        >
          Parse & Add
        </button>
      </div>
    </div>
  );
}