export async function getAccountId(client: any, name: string, userId: string) {
  const res = await client.query(
    `SELECT id FROM accounts WHERE name = $1 AND user_id = $2 LIMIT 1`,
    [name, userId]
  );

  if (res.rows.length > 0) return res.rows[0].id;

  const insert = await client.query(
    `INSERT INTO accounts (name, type, user_id)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [
      name,
      name === "Debt" ? "LIABILITY" : "ASSET",
      userId,
    ]
  );

  return insert.rows[0].id;
}

export async function resolveAccounts(client: any, account: string, userId: string) {
  const accountId = await getAccountId(client, account, userId);
  const savingsId = await getAccountId(client, "Savings", userId);
  const debtId = await getAccountId(client, "Debt", userId);
  const receivableId = await getAccountId(client, "Receivable", userId);

  return { accountId, savingsId, debtId, receivableId };
}
