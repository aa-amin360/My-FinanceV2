"use client";

import React from "react";

type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  variant?: "danger" | "warning" | "info";
};

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  loading = false,
  variant = "danger",
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  // Determine confirm button style based on semantic variant
  const getConfirmBtnStyle = () => {
    switch (variant) {
      case "warning":
        return "bg-amber-500 hover:bg-amber-600 text-black";
      case "info":
        return "bg-indigo-500 hover:bg-indigo-600 text-white";
      case "danger":
      default:
        return "bg-red-500 hover:bg-red-600 text-white";
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4 animate-fadeIn" 
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white/75 dark:bg-black/60 border border-black/[0.05] dark:border-white/[0.05] text-black dark:text-white backdrop-blur-xl rounded-[28px] p-6 w-full max-w-[320px] text-center shadow-2xl flex flex-col gap-4 animate-modalIn"
      >
        <h3 className="text-lg font-bold text-black dark:text-white">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
          {description}
        </p>

        <div className="flex gap-3 justify-center mt-2">
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px] ${getConfirmBtnStyle()}`}
          >
            {loading ? "Processing..." : confirmText}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}