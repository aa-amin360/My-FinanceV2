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

// =========================
// MAIN
// =========================

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debt, setDebt] = useState(0);
  const [receivable, setReceivable] = useState(0);
  const [balance, setBalance] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);

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

  const loadData = async () => {
    const tx = await fetch("/api/transactions").then((r) => r.json());
    setTransactions(tx.data || []);

    const d = await fetch("/api/debts").then((r) => r.json());
    setDebt(Number(d.total || 0));

    const r = await fetch("/api/receivables").then((r) => r.json());
    setReceivable(Number(r.total || 0));

    const b = await fetch("/api/balance").then((r) => r.json());
    setBalance(Number(b.total || 0));
  };

  useEffect(() => {
    loadData();

    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.data || []));
  }, []);

  // =========================
  // GLOBAL +
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
    if ((action === "INCOME" || action === "EXPENSE") && !category) {
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
        <h1 className="text-3xl font-bold">{balance.toFixed(2)} Tk</h1>
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
      <div className="mt-6">
        <CashflowChart data={chartData} />
      </div>

      {/* HISTORY */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Recent Transactions</h3>

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
        <Modal
          step={step}
          setStep={setStep}
          setShowModal={setShowModal}
          action={action}
          setAction={setAction}
          amount={amount}
          setAmount={setAmount}
          account={account}
          setAccount={setAccount}
          category={category}
          setCategory={setCategory}
          entity={entity}
          setEntity={setEntity}
          note={note}
          setNote={setNote}
          categories={categories}
          handleSubmit={handleSubmit}
        />
      )}
    </DashboardLayout>
  );
}

// =========================
// MODAL COMPONENT
// =========================

function Modal(props: any) {
  const {
    step,
    setStep,
    setShowModal,
    action,
    setAction,
    amount,
    setAmount,
    account,
    setAccount,
    category,
    setCategory,
    entity,
    setEntity,
    note,
    setNote,
    categories,
    handleSubmit,
  } = props;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="w-[340px] bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xl flex flex-col gap-4">

        {/* ACTION */}
        {step === "ACTION" && (
          <>
            <h3 className="text-center font-semibold">Select Action</h3>

            <div className="grid grid-cols-2 gap-3">
              <ActionCard label="Income" icon="📈" onClick={() => { setAction("INCOME"); setStep("FORM"); }} />
              <ActionCard label="Expense" icon="📉" onClick={() => { setAction("EXPENSE"); setStep("FORM"); }} />
              <ActionCard label="Borrow" icon="💳" onClick={() => { setAction("BORROW"); setStep("FORM"); }} />
              <ActionCard label="Give" icon="📥" onClick={() => { setAction("GIVE"); setStep("FORM"); }} />
            </div>

            <button onClick={() => setShowModal(false)} className="text-sm text-gray-400">Cancel</button>
          </>
        )}

        {/* FORM */}
        {step === "FORM" && (
          <>
            <h3 className="font-semibold">{action}</h3>

            <input className="input" placeholder="Amount" value={amount} onChange={(e)=>setAmount(e.target.value)} />

            <select className="input" value={account} onChange={(e)=>setAccount(e.target.value)}>
              <option>Cash</option>
              <option>Bank</option>
            </select>

            {(action==="INCOME"||action==="EXPENSE") && (
              <select className="input" value={category} onChange={(e)=>setCategory(e.target.value)}>
                <option value="">Category</option>
                {categories.filter((c:any)=>c.type===action).map((c:any)=>(
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            {(action==="BORROW"||action==="GIVE") && (
              <input className="input" placeholder="Entity" value={entity} onChange={(e)=>setEntity(e.target.value)} />
            )}

            <input className="input" placeholder="Note" value={note} onChange={(e)=>setNote(e.target.value)} />

            <button onClick={handleSubmit} className="btn-primary">Save</button>
            <button onClick={()=>setStep("ACTION")} className="btn-secondary">Back</button>
          </>
        )}
      </div>
    </div>
  );
}

// =========================
// SMALL COMPONENTS
// =========================

function Card({ title, value, color }: any) {
  return (
    <div className="bg-gray-100 dark:bg-slate-900 p-5 rounded-2xl">
      <p className={color}>{title}</p>
      <h2 className="text-2xl mt-2 font-bold">{value.toFixed(2)} Tk</h2>
    </div>
  );
}

function ActionCard({ label, icon, onClick }: any) {
  return (
    <div onClick={onClick} className="p-4 rounded-xl bg-slate-800 hover:scale-105 transition cursor-pointer">
      <div className="text-xl">{icon}</div>
      <div className="text-sm mt-1">{label}</div>
    </div>
  );
}
