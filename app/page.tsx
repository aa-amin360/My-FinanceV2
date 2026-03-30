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

  useEffect(() => {
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
  }, []);

  // =========================
  // CALCULATIONS
  // =========================

  let income = 0;
  let expense = 0;

  transactions.forEach((t) => {
    const amount = Number(t.amount);

    if (t.type === "INCOME") income += amount;
    if (t.type === "EXPENSE") expense += amount;
  });

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

      {/* SUMMARY */}
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
        <span>{transactions.length} total</span>
      </div>

      {transactions.map((t) => {
        const amount = Number(t.amount);

        // =========================
        // FLOW-BASED SIGN LOGIC
        // =========================
        const isPositive =
          t.type === "INCOME" ||
          t.type === "DEBT_TAKEN" ||
          t.type === "RECEIVABLE_RECEIVED";

        const sign = isPositive ? "+" : "-";
        const color = isPositive ? "#22c55e" : "#ef4444";

        // Flow text
        const flow =
          (t.from_account || "Outside") +
          " → " +
          (t.to_account || "Outside");

        return (
          <div key={t.id} style={transactionCard}>
            <div>
              <div style={txTitle}>
                {t.note || t.type.replaceAll("_", " ")}
              </div>

              <div style={txFlow}>{flow}</div>

              <div style={txDate}>
                {new Date(t.date).toDateString()}
              </div>
            </div>

            <div style={{ color, fontWeight: "bold" }}>
              {sign} {amount.toFixed(2)} Tk
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =========================
// COMPONENTS
// =========================

function Card({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
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
      <div style={{ opacity: 0.5, marginTop: 5 }}>
        Coming soon...
      </div>
    </div>
  );
}

// =========================
// STYLES
// =========================

const container = {
  background: "#020617",
  color: "white",
  minHeight: "100vh",
  padding: 20,
  fontFamily: "sans-serif",
};

const title = {
  color: "#22c55e",
};

const balanceCard = {
  background: "#0f172a",
  padding: 20,
  borderRadius: 12,
  marginTop: 20,
};

const label = {
  opacity: 0.6,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 10,
  marginTop: 20,
};

const card = {
  background: "#0f172a",
  padding: 15,
  borderRadius: 10,
};

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: 30,
};

const transactionCard = {
  background: "#0f172a",
  padding: 15,
  borderRadius: 10,
  marginTop: 10,
  display: "flex",
  justifyContent: "space-between",
};

const txTitle = {
  fontWeight: "bold",
};

const txFlow = {
  opacity: 0.7,
  fontSize: 12,
};

const txDate = {
  opacity: 0.5,
  fontSize: 11,
};
