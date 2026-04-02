"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";

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

  transactions.forEach((t) => {
    const val = Number(t.amount);
    if (t.type === "INCOME") income += val;
    if (t.type === "EXPENSE") expense += val;
  });

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
      <div className="bg-slate-900 p-6 rounded-xl">
        <p className="text-gray-400 text-sm">Current Balance</p>
        <h1 className="text-3xl font-bold mt-2">{balance.toFixed(2)} Tk</h1>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <Card title="Income" value={income} color="text-green-400" icon="📈" />
        
        <Card title="Expenses" value={expense} color="text-red-400" icon="📉" />
        
        <Card title="Savings" value={0} color="text-blue-400" icon="💾" />
        
        <Card title="Debt" value={debt} color="text-cyan-400" icon="💳" />
        
        <Card title="Receivable" value={receivable} color="text-yellow-400" icon="📥" />
        <ReportCard />
      </div>

      {/* TRANSACTIONS */}
      <h3 className="mt-8 mb-2">Recent Transactions</h3>

      <div className="flex flex-col gap-2">
        {transactions.map((t) => {
          const amount = Number(t.amount);

          const isPositive =
            t.type === "INCOME" ||
            t.type === "DEBT_TAKEN" ||
            t.type === "RECEIVABLE_RECEIVED";

          return (
            <div
              key={t.id}
              className="bg-slate-900 p-4 rounded-xl flex justify-between"
            >
              <div>
                <div className="font-semibold">
                  {t.note || t.type.replaceAll("_", " ")}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(t.date).toDateString()}
                </div>
              </div>

              <div
                className={`font-bold ${
                  isPositive ? "text-green-400" : "text-red-400"
                }`}
              >
                {isPositive ? "+" : "-"} {amount} Tk
              </div>
            </div>
          );
        })}
      </div>

      {/* FAB */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-500 text-black text-2xl"
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
          <div className="bg-slate-900 p-6 rounded-xl w-80 flex flex-col gap-3">

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

                <input placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
                
                <select value={account} onChange={(e) => setAccount(e.target.value)}>
                  <option>Cash</option>
                  <option>Bank</option>
                </select>

                {(action === "INCOME" || action === "EXPENSE") && (
                  <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
                )}

                {(action === "BORROW" || action === "GIVE") && (
                  <input placeholder="Person / Bank" value={entity} onChange={(e) => setEntity(e.target.value)} />
                )}

                <input placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />

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

function Card({
  title,
  value,
  color,
  icon,
}: {
  title: string;
  value: number;
  color: string;
  icon: string;
}) {
  return (
    <div className="bg-slate-900 p-5 rounded-2xl shadow-md hover:shadow-lg transition-all">
      
      {/* TOP */}
      <div className="flex justify-between items-center">
        <p className={`text-sm ${color}`}>{title}</p>
        <span className="text-lg">{icon}</span>
      </div>

      {/* VALUE */}
      <h2 className="text-2xl font-bold mt-3">
        {value.toFixed(2)} Tk
      </h2>

      {/* SUBTEXT */}
      <p className="text-xs text-gray-400 mt-1">
        Updated just now
      </p>
    </div>
  );
}

function ReportCard() {
  return (
    <div className="bg-slate-900 p-4 rounded-xl">
      <p className="text-purple-400">Monthly Report</p>
      <p className="text-gray-400 text-sm">Coming soon...</p>
    </div>
  );
}
