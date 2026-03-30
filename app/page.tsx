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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data.data || []);
        setLoading(false);
      });
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

  const balance = income - expense;

  // =========================
  // UI
  // =========================

  return (
    <div
      style={{
        background: "#0b1220",
        color: "white",
        minHeight: "100vh",
        padding: 20,
        fontFamily: "sans-serif",
      }}
    >
      <h2 style={{ color: "#22c55e" }}>My Finance</h2>

      {/* BALANCE */}
      <div
        style={{
          background: "#111827",
          padding: 20,
          borderRadius: 12,
          marginTop: 20,
        }}
      >
        <div style={{ opacity: 0.7 }}>Current Balance</div>
        <h1>{balance.toFixed(2)} Tk</h1>
      </div>

      {/* SUMMARY */}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <div style={cardStyle}>
          <div style={{ color: "#22c55e" }}>Income</div>
          <div>{income.toFixed(2)} Tk</div>
        </div>

        <div style={cardStyle}>
          <div style={{ color: "#ef4444" }}>Expense</div>
          <div>{expense.toFixed(2)} Tk</div>
        </div>
      </div>

      {/* TRANSACTIONS */}
      <h3 style={{ marginTop: 30 }}>Recent Transactions</h3>

      {loading && <p>Loading...</p>}

      {transactions.map((t) => {
        const amount = Number(t.amount);
        const isIncome = t.type === "INCOME";

        return (
          <div
            key={t.id}
            style={{
              background: "#111827",
              padding: 15,
              borderRadius: 10,
              marginTop: 10,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontWeight: "bold" }}>
                {t.type.replace("_", " ")}
              </div>
              <div style={{ opacity: 0.6, fontSize: 12 }}>
                {new Date(t.date).toDateString()}
              </div>
              <div style={{ opacity: 0.6 }}>
                {t.from_account} → {t.to_account}
              </div>
            </div>

            <div
              style={{
                color: isIncome ? "#22c55e" : "#ef4444",
                fontWeight: "bold",
              }}
            >
              {isIncome ? "+" : "-"} {amount.toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =========================
// STYLE
// =========================

const cardStyle = {
  flex: 1,
  background: "#111827",
  padding: 15,
  borderRadius: 10,
};
