"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import CashflowChart from "../components/charts/CashflowChart";

type Transaction = {
  id: string;
  type: string;
  amount: string;
  from_account: string | null;
  to_account: string | null;
  date: string;
  note: string | null;
};

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debt, setDebt] = useState(0);
  const [receivable, setReceivable] = useState(0);
  const [balance, setBalance] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<"ACTION" | "FORM">("ACTION");

  const [action, setAction] = useState("INCOME");
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("Cash");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");
  const [entity, setEntity] = useState("");

  // =========================
  // LOAD DATA
  // =========================
  const loadData = () => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => setTransactions(data.data || []));

    fetch("/api/debts")
      .then((res) => res.json())
      .then((data) => setDebt(Number(data.total || 0)));

    fetch("/api/receivables")
      .then((res) => res.json())
      .then((data) => setReceivable(Number(data.total || 0)));

    fetch("/api/balance")
      .then((res) => res.json())
      .then((data) => setBalance(Number(data.total || 0)));
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================
  // CALCULATIONS
  // =========================
  let income = 0;
  let expense = 0;

  const monthlyDataMap: Record<string, { income: number; expense: number }> = {};

  transactions.forEach((t) => {
    const amount = Number(t.amount);
    const date = new Date(t.date);
    const month = date.toLocaleString("default", { month: "short" });

    if (!monthlyDataMap[month]) {
      monthlyDataMap[month] = { income: 0, expense: 0 };
    }

    if (t.type === "INCOME") {
      income += amount;
      monthlyDataMap[month].income += amount;
    }

    if (t.type === "EXPENSE") {
      expense += amount;
      monthlyDataMap[month].expense += amount;
    }
  });

  const chartData = Object.keys(monthlyDataMap).map((month) => ({
    month,
    income: monthlyDataMap[month].income,
    expense: monthlyDataMap[month].expense,
  }));

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async () => {
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

    if (category) body.category = category;
    if (entity) body.entity = entity;

    await fetch("/api/transactions", {
      method: "POST",
      body: JSON.stringify(body),
    });

    setShowModal(false);
    setStep("ACTION");
    setAmount("");
    setNote("");
    setCategory("");
    setEntity("");

    loadData();
  };

  return (
    <DashboardLayout>
      {/* BALANCE */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-2xl shadow-lg text-black">
        <div className="flex justify-between items-center">
          <p className="text-sm opacity-80">Current Balance</p>
          <span>💰</span>
        </div>

        <h1 className="text-3xl font-bold mt-3">
          {balance.toFixed(2)} Tk
        </h1>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <Card title="Income" value={income} color="text-green-500" icon="📈" />
        <Card title="Expenses" value={expense} color="text-red-500" icon="📉" />
        <Card title="Savings" value={0} color="text-blue-500" icon="💾" />
        <Card title="Debt" value={debt} color="text-cyan-500" icon="💳" />
        <Card title="Receivable" value={receivable} color="text-yellow-500" icon="📥" />
        <ReportCard />
      </div>

      {/* CHART */}
      <CashflowChart data={chartData} />

      {/* TRANSACTIONS */}
      <h3 className="mt-8 mb-2">Recent Transactions</h3>

      <div className="mt-6 bg-gray-100 dark:bg-slate-900 rounded-2xl overflow-hidden">
        {/* HEADER */}
        <div className="grid grid-cols-4 px-4 py-3 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-slate-800">
          <div>Name</div>
          <div>Date</div>
          <div>Type</div>
          <div className="text-right">Amount</div>
        </div>

        {/* ROWS */}
        {transactions.slice(0, 8).map((t) => {
          const amount = Number(t.amount);

          const isPositive =
            t.type === "INCOME" ||
            t.type === "DEBT_TAKEN" ||
            t.type === "RECEIVABLE_RECEIVED";

          return (
            <div
              key={t.id}
              className="grid grid-cols-4 px-4 py-3 border-b border-gray-200 dark:border-slate-800 hover:bg-gray-200 dark:hover:bg-slate-800 transition-all"
            >
              <div className="font-medium">
                {t.note || t.type.replace("_", " ")}
              </div>

              <div className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(t.date).toDateString()}
              </div>

              <div>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    t.type === "INCOME"
                      ? "bg-green-500/20 text-green-500"
                      : t.type === "EXPENSE"
                      ? "bg-red-500/20 text-red-500"
                      : t.type === "DEBT_TAKEN"
                      ? "bg-blue-500/20 text-blue-500"
                      : t.type === "DEBT_REPAID"
                      ? "bg-cyan-500/20 text-cyan-500"
                      : t.type === "RECEIVABLE_GIVEN"
                      ? "bg-yellow-500/20 text-yellow-500"
                      : t.type === "RECEIVABLE_RECEIVED"
                      ? "bg-purple-500/20 text-purple-500"
                      : "bg-gray-500/20 text-gray-500"
                  }`}
                >
                  {t.type.replace("_", " ")}
                </span>
              </div>

              <div
                className={`text-right font-semibold ${
                  isPositive ? "text-green-500" : "text-red-500"
                }`}
              >
                {isPositive ? "+" : "-"}
                {amount.toFixed(2)} Tk
              </div>
            </div>
          );
        })}
      </div>

      {/* FAB */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-500 text-black text-2xl shadow-lg"
        onClick={() => {
          setShowModal(true);
          setStep("ACTION");
        }}
      >
        +
      </button>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl w-80 flex flex-col gap-3">
            {step === "ACTION" && (
              <>
                <h3>Select Action</h3>
                <button onClick={() => { setAction("INCOME"); setStep("FORM"); }}>Income</button>
                <button onClick={() => { setAction("EXPENSE"); setStep("FORM"); }}>Expense</button>
                <button onClick={() => { setAction("BORROW"); setStep("FORM"); }}>Borrow</button>
                <button onClick={() => { setAction("GIVE"); setStep("FORM"); }}>Give</button>
                <button onClick={() => setShowModal(false)}>Cancel</button>
              </>
            )}

            {step === "FORM" && (
              <>
                <h3>{action}</h3>

                <input className="p-2 rounded bg-gray-200 dark:bg-slate-800" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />

                <select className="p-2 rounded bg-gray-200 dark:bg-slate-800" value={account} onChange={(e) => setAccount(e.target.value)}>
                  <option>Cash</option>
                  <option>Bank</option>
                </select>

                {(action === "INCOME" || action === "EXPENSE") && (
                  <input className="p-2 rounded bg-gray-200 dark:bg-slate-800" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
                )}

                {(action === "BORROW" || action === "GIVE") && (
                  <input className="p-2 rounded bg-gray-200 dark:bg-slate-800" placeholder="Person / Bank" value={entity} onChange={(e) => setEntity(e.target.value)} />
                )}

                <input className="p-2 rounded bg-gray-200 dark:bg-slate-800" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />

                <button onClick={handleSubmit}>Save</button>
                <button onClick={() => setStep("ACTION")}>← Back</button>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// =========================
// COMPONENTS
// =========================

function Card({ title, value, color, icon }: any) {
  return (
    <div className="bg-gray-100 dark:bg-slate-900 p-5 rounded-2xl shadow-md hover:shadow-lg transition-all">
      <div className="flex justify-between">
        <p className={color}>{title}</p>
        <span>{icon}</span>
      </div>
      <h2 className="text-2xl mt-3 font-bold">{value.toFixed(2)} Tk</h2>
    </div>
  );
}

function ReportCard() {
  return (
    <div className="bg-gray-100 dark:bg-slate-900 p-4 rounded-xl">
      <p className="text-purple-500">Monthly Report</p>
      <p className="text-gray-500 text-sm">Coming soon...</p>
    </div>
  );
}
