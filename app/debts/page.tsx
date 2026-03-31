"use client";

import { useEffect, useState } from "react";

type Debt = {
  entity_id: string;
  name: string;
  total_amount: string;
  remaining_amount: string;
};

type Transaction = {
  id: string;
  type: string;
  amount: string;
  date: string;
  note: string | null;
  entity_id: string | null;
};

export default function DebtPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetch("/api/debts/details", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setDebts(data.data || []));

    fetch("/api/transactions", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setTransactions(data.data || []));
  }, []);

  return (
    <div style={container}>
      <h2 style={title}>Debt Details</h2>

      {debts.map((d) => {
        const personTx = transactions.filter(
          (t) => t.entity_id === d.entity_id
        );

        return (
          <div key={d.entity_id} style={card}>
            <h3>{d.name}</h3>

            <div style={row}>
              <span>Total:</span>
              <span>{Number(d.total_amount).toFixed(2)} Tk</span>
            </div>

            <div style={row}>
              <span>Remaining:</span>
              <span>{Number(d.remaining_amount).toFixed(2)} Tk</span>
            </div>

            <div style={{ marginTop: 10, fontWeight: "bold" }}>
              Transactions
            </div>

            {personTx.map((t) => {
              const amount = Number(t.amount);

              return (
                <div key={t.id} style={tx}>
                  <div>
                    {t.type.replace("_", " ")}
                    <div style={date}>
                      {new Date(t.date).toDateString()}
                    </div>
                  </div>

                  <div
                    style={{
                      color:
                        t.type === "DEBT_TAKEN"
                          ? "#22c55e"
                          : "#ef4444",
                    }}
                  >
                    {t.type === "DEBT_TAKEN" ? "+" : "-"}
                    {amount.toFixed(2)} Tk
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}


const container = {
  background: "#020617",
  color: "white",
  minHeight: "100vh",
  padding: 20,
};

const title = {
  color: "#22c55e",
};

const card = {
  background: "#0f172a",
  padding: 15,
  borderRadius: 10,
  marginTop: 20,
};

const row = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: 5,
};

const tx = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: 10,
  padding: 10,
  background: "#020617",
  borderRadius: 8,
};

const date = {
  fontSize: 12,
  opacity: 0.6,
};
