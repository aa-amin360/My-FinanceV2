"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import CashflowChart from "../components/charts/CashflowChart";
import Link from "next/link";

type Transaction = {
  id: string;
  type: string;
  amount: string;
  date: string;
  note: string | null;
};

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debt, setDebt] = useState(0);
  const [receivable, setReceivable] = useState(0);
  const [balance, setBalance] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);

  // modal
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<"ACTION" | "FORM">("ACTION");

  // form
  const [action, setAction] = useState("INCOME");
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("Cash");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");
  const [entity, setEntity] = useState("");

  // =========================
  // LOAD DATA
  // =========================
  const loadData = async () => {
    const tx = await fetch("/api/transactions").then((r) => r.json());
    setTransactions(tx.data || []);

    const d = await fetch("/api/debts").then((r) => r.json());
    setDebt(Number(d.total || 0));

    const rcv = await fetch("/api/receivables").then((r) => r.json());
    setReceivable(Number(rcv.total || 0));

    const bal = await fetch("/api/balance").then((r) => r.json());
    setBalance(Number(bal.total || 0));
  };

  useEffect(() => {
    loadData();

    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.data || []));
  }, []);

  // =========================
  // 🔥 GLOBAL + BUTTON HANDLER
  // =========================
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail === "GENERAL") {
        setShowModal(true);
        setStep("ACTION");
      }
    };

    window.addEventListener("openAdd", handler);
    return () => window.removeEventListener("openAdd", handler);
  }, []);

  // =========================
  // CALCULATIONS
  // =========================
  let income = 0;
  let expense = 0;

  const monthlyMap: Record<string, { income: number; expense: number }> = {};

  transactions.forEach((t) => {
    const amt = Number(t.amount);
    const month = new Date(t.date).toLocaleString("default", {
      month: "short",
    });

    if (!monthlyMap[month]) {
      monthlyMap[month] = { income: 0, expense: 0 };
    }

    if (t.type === "INCOME") {
      income += amt;
      monthlyMap[month].income += amt;
    }

    if (t.type === "EXPENSE") {
      expense += amt;
      monthlyMap[month].expense += amt;
    }
  });

  const chartData = Object.keys(monthlyMap).map((m) => ({
    month: m,
    income: monthlyMap[m].income,
    expense: monthlyMap[m].expense,
  }));

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async () => {
    if (
      (action === "INCOME" || action === "EXPENSE") &&
      !category
    ) {
      alert("Select category");
      return;
    }

    let type = "";

    if (action === "INCOME") type = "INCOME";
    if (action === "EXPENSE") type = "EXPENSE";
    if (action === "BORROW") type = "DEBT_TAKEN";
    if (action === "GIVE") type = "RECEIVABLE_GIVEN";

    const body: any = {
      type,
      amount: Number(amount),
      account,
      date: new Date().toISOString(),
      note,
    };

    if (category) body.category_id = category;
    if (entity) body.entity = entity;

    await fetch("/api/transactions", {
      method: "POST",
      body: JSON.stringify(body),
    });

    // reset
    setShowModal(false);
    setStep("ACTION");
    setAmount("");
    setNote("");
    setCategory("");
    setEntity("");

    await loadData(); 
  };

  

  return (
    <DashboardLayout>
      {/* BALANCE */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-2xl text-black">
        <h1 className="text-3xl font-bold">
          {balance.toFixed(2)} Tk
        </h1>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <Card title="Income" value={income} color="text-green-500" />
        <Card title="Expenses" value={expense} color="text-red-500" />

        <Link href="/debts">
          <Card title="Debt" value={debt} color="text-cyan-500" />
        </Link>

        <Link href="/receivables">
          <Card title="Receivable" value={receivable} color="text-yellow-500" />
        </Link>
      </div>

      {/* CHART */}
      <CashflowChart data={chartData} />

      {/* HISTORY */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">
          Recent Transactions
        </h3>

        <div className="bg-gray-100 dark:bg-slate-900 rounded-2xl overflow-hidden">
          {transactions.slice(0, 5).map((t) => {
            const isPositive =
              t.type === "INCOME" ||
              t.type === "DEBT_TAKEN" ||
              t.type === "RECEIVABLE_RECEIVED";

            return (
              <div
                key={t.id}
                className="flex justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-800"
              >
                <div>
                  <p className="font-medium">{t.type}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(t.date).toDateString()}
                  </p>
                </div>

                <div
                  className={`font-semibold ${
                    isPositive ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {isPositive ? "+" : "-"}
                  {Number(t.amount).toFixed(2)} Tk
                </div>
              </div>
            );
          })}

          {transactions.length === 0 && (
            <div className="p-4 text-center text-gray-400">
              No transactions yet
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl w-80 flex flex-col gap-3">

            {/* ================= ACTION STEP ================= */}
            {step === "ACTION" && (
              <>
                <h3 className="text-center text-lg font-semibold mb-4">
                  Select Action
                </h3>
            
                <div className="grid grid-cols-2 gap-3">
                  <ActionCard
                    label="Income"
                    icon="📈"
                    color="bg-green-500/20 text-green-400"
                    onClick={() => {
                      setAction("INCOME");
                      setStep("FORM");
                    }}
                  />
            
                  <ActionCard
                    label="Expense"
                    icon="📉"
                    color="bg-red-500/20 text-red-400"
                    onClick={() => {
                      setAction("EXPENSE");
                      setStep("FORM");
                    }}
                  />
            
                  <ActionCard
                    label="Borrow"
                    icon="💳"
                    color="bg-blue-500/20 text-blue-400"
                    onClick={() => {
                      setAction("BORROW");
                      setStep("FORM");
                    }}
                  />
            
                  <ActionCard
                    label="Give"
                    icon="📥"
                    color="bg-yellow-500/20 text-yellow-400"
                    onClick={() => {
                      setAction("GIVE");
                      setStep("FORM");
                    }}
                  />
                </div>
            
                <button
                  onClick={() => setShowModal(false)}
                  className="mt-4 text-sm text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
              </>
            )}
            
            {/* ================= FORM STEP ================= */}
            {step === "FORM" && (
              <>
                <h3 className="text-lg font-semibold mb-2">{action}</h3>
            
                {/* AMOUNT */}
                <input
                  className="w-full p-3 rounded-xl bg-gray-200 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
            
                {/* ACCOUNT */}
                <select
                  className="w-full p-3 rounded-xl bg-gray-200 dark:bg-slate-800 focus:outline-none"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                >
                  <option>Cash</option>
                  <option>Bank</option>
                </select>
            
                {/* CATEGORY */}
                {(action === "INCOME" || action === "EXPENSE") && (
                  <select
                    className="w-full p-3 rounded-xl bg-gray-200 dark:bg-slate-800 focus:outline-none"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Select Category</option>
            
                    {categories
                      .filter((c) => c.type === action)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                )}
            
                {/* ENTITY */}
                {(action === "BORROW" || action === "GIVE") && (
                  <input
                    className="w-full p-3 rounded-xl bg-gray-200 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Person / Bank name"
                    value={entity}
                    onChange={(e) => setEntity(e.target.value)}
                  />
                )}
            
                {/* NOTE */}
                <input
                  className="w-full p-3 rounded-xl bg-gray-200 dark:bg-slate-800 focus:outline-none"
                  placeholder="Add note (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
            
                {/* ACTION BUTTONS */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 bg-green-500 text-black py-3 rounded-xl font-semibold hover:scale-105 transition"
                  >
                    Save
                  </button>
            
                  <button
                    onClick={() => setStep("ACTION")}
                    className="flex-1 bg-gray-300 dark:bg-slate-700 py-3 rounded-xl hover:scale-105 transition"
                  >
                    Back
                  </button>
                </div>
              </>
            )}            
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// =========================
// CARD
// =========================

function Card({ title, value, color }: any) {
  return (
    <div className="bg-gray-100 dark:bg-slate-900 p-5 rounded-2xl">
      <p className={color}>{title}</p>
      <h2 className="text-2xl mt-3 font-bold">
        {value.toFixed(2)} Tk
      </h2>
    </div>
  );
}

function ActionCard({ label, icon, color, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl cursor-pointer transition transform hover:scale-105 ${color}`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-sm font-semibold">{label}</div>
    </div>
  );
}
