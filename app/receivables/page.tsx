"use client";

import { useEffect, useState } from "react";

type Receivable = {
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

export default function ReceivablePage() {
  const [data, setData] = useState<Receivable[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetch("/api/receivables/details", { cache: "no-store" })
      .then((res) => res.json())
      .then((d) => setData(d.data || []));

    fetch("/api/transactions", { cache: "no-store" })
      .then((res) => res.json())
      .then((d) => setTransactions(d.data || []));
  }, []);

  return (
    <div style={container}>
      <h2 style={title}>Receivable Details</h2>

      {data.map((r) => {
        const personTx = transactions.filter(
          (t) =>
            t.entity_id === r.entity_id &&
            (t.type === "RECEIVABLE_GIVEN" ||
              t.type === "RECEIVABLE_RECEIVED")
        );

        return (
          <div key={r.entity_id} style={card}>
            <h3>{r.name}</h3>

            <div style={row}>
              <span>Total Given:</span>
              <span>{Number(r.total_amount).toFixed(2)} Tk</span>
            </div>

            <div style={row}>
              <span>Remaining:</span>
              <span>{Number(r.remaining_amount).toFixed(2)} Tk</span>
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
                        t.type === "RECEIVABLE_RECEIVED"
                          ? "#22c55e"
                          : "#ef4444",
                    }}
                  >
                    {t.type === "RECEIVABLE_RECEIVED" ? "+" : "-"}
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
