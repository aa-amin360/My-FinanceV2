export async function checkBalance(
  client: any,
  accountId: string,
  userId: string,
  type: string,
  amount: number,
  TYPE_META: any
) {
  // Lock related transactions during calculation
  const res = await client.query(
    `
    SELECT COALESCE(SUM(
      CASE
        WHEN to_account = $1 THEN amount
        WHEN from_account = $1 THEN -amount
        ELSE 0
      END
    ), 0) AS balance
    FROM transactions
    WHERE user_id = $2
      AND (to_account = $1 OR from_account = $1)
      AND (
        parent_id IS NOT NULL
        OR id NOT IN (
          SELECT DISTINCT parent_id 
          FROM transactions 
          WHERE parent_id IS NOT NULL 
            AND user_id = $2
            AND parent_id IN (
              SELECT id FROM transactions 
              WHERE type IN ('DEBT_REPAID', 'RECEIVABLE_RECEIVED')
            )
        )
      )
    `,
    [accountId, userId]
  );

  const balance = Number(res.rows[0].balance || 0);

  if (
    TYPE_META[type].flow === "OUT" &&
    amount > balance
  ) {
    throw new Error("Insufficient balance");
  }
}
