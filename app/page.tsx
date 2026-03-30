"use client";

import { useEffect, useState } from "react";

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

  // 🔥 NEW FORM MODEL
  const [action, setAction] = useState("INCOME");
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("Cash");
  const [note, setNote] = useState("");

  const [category, setCategory] = useState("");
  const [entity, setEntity] = useState("");

  // =========================
  // FETCH DATA
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
  // SUBMIT (ACTION → TYPE)
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

    // Reset
    setShowModal(false);
    setAmount("");
    setNote("");
    setCategory("");
    setEntity("");

    loadData();
  };

  // =========================
  // UI
  // =========================

  return (
    <div style={container}>
      <h2 style={title}>My Finance</h2>

      {/* BALANCE */}
      <div style={balanceCard}>
        <div style={label}>Current Balance</div>
        <h1>{balance.toFixed(2)} Tk</h1>
      </div>

      {/* CARDS */}
      <div style={grid}>
        <Card title="Income" value={income} color="#22c55e" />
        <Card title="Expenses" value={expense} color="#ef4444" />
        <Card title="Savings" value={0} color="#3b82f6" />
        <Card title="Debt" value={debt} color="#60a5fa" />
        <Card title="Receivable" value={receivable} color="#f59e0b" />
        <ReportCard />
      </div>

      {/* TRANSACTIONS */}
      <div style={sectionHeader}>
        <h3>Recent Transactions</h3>
      </div>

      {transactions.map((t) => {
        const amount = Number(t.amount);

        const isPositive =
          t.type === "INCOME" ||
          t.type === "DEBT_TAKEN" ||
          t.type === "RECEIVABLE_RECEIVED";

        const sign = isPositive ? "+" : "-";
        const color = isPositive ? "#22c55e" : "#ef4444";

        return (
          <div key={t.id} style={transactionCard}>
            <div>
              <div style={txTitle}>
                {t.note || t.type.replaceAll("_", " ")}
              </div>
              <div style={txDate}>
                {new Date(t.date).toDateString()}
              </div>
            </div>

            <div style={{ color }}>
              {sign} {amount} Tk
            </div>
          </div>
        );
      })}

      {/* FLOAT BUTTON */}
      <button style={fab} onClick={() => setShowModal(true)}>
        +
      </button>

      {/* MODAL */}
      {showModal && (
        <div style={modal}>
          <div style={modalContent}>
            <h3>Add Transaction</h3>

            {/* ACTION */}
            <select value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
              <option value="BORROW">Borrow</option>
              <option value="GIVE">Give</option>
            </select>

            {/* AMOUNT */}
            <input
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            {/* ACCOUNT */}
            <select value={account} onChange={(e) => setAccount(e.target.value)}>
              <option>Cash</option>
              <option>Bank</option>
            </select>

            {/* CATEGORY */}
            {(action === "INCOME" || action === "EXPENSE") && (
              <input
                placeholder="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            )}

            {/* ENTITY */}
            {(action === "BORROW" || action === "GIVE") && (
              <input
                placeholder="Person / Bank"
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
              />
            )}

            {/* NOTE */}
            <input
              placeholder="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <button onClick={handleSubmit}>Save</button>
            <button onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================
// COMPONENTS
// =========================

function Card({ title, value, color }: any) {
  return (
    <div style={card}>
      <div style={{ color }}>{title}</div>
      <div>{value.toFixed(2)} Tk</div>
    </div>
  );
}

function ReportCard() {
  return (
    <div style={card}>
      <div style={{ color: "#a78bfa" }}>Monthly Report</div>
      <div style={{ opacity: 0.5 }}>Coming soon...</div>
    </div>
  );
}

// =========================
// STYLES
// =========================

const container = { background: "#020617", color: "white", minHeight: "100vh", padding: 20 };
const title = { color: "#22c55e" };
const balanceCard = { background: "#0f172a", padding: 20, borderRadius: 12, marginTop: 20 };
const label = { opacity: 0.6 };

const grid = { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginTop: 20 };
const card = { background: "#0f172a", padding: 15, borderRadius: 10 };

const sectionHeader = { marginTop: 30 };
const transactionCard = { background: "#0f172a", padding: 15, borderRadius: 10, marginTop: 10, display: "flex", justifyContent: "space-between" };
const txTitle = { fontWeight: "bold" };
const txDate = { opacity: 0.5 };

const fab: React.CSSProperties = {
  position: "fixed",
  bottom: 20,
  right: 20,
  width: 60,
  height: 60,
  borderRadius: "50%",
  background: "#22c55e",
  fontSize: 30,
};

const modal: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.7)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modalContent: React.CSSProperties = {
  background: "#111827",
  padding: 20,
  borderRadius: 10,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};
