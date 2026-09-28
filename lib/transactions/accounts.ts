import type { DbClient } from "@/lib/db";

// Internal ledger accounts every user gets alongside their spendable accounts
const LIABILITY_ACCOUNTS = ["Debt"];

export type AccountIds = {
  accountId: number;
  savingsId: number;
  debtId: number;
  receivableId: number;
};

// Find or create an account by name. The insert tolerates a concurrent request
// creating the same account (unique index on user_id + name, see scripts/migrate.js).
export async function getAccountId(client: DbClient, name: string, userId: string): Promise<number> {
  const find = () =>
    client.query(
      `SELECT id FROM accounts
       WHERE user_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2))
       ORDER BY id
       LIMIT 1`,
      [userId, name]
    );

  const existing = await find();
  if (existing.rows.length > 0) return existing.rows[0].id;

  const inserted = await client.query(
    `INSERT INTO accounts (name, type, user_id)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [name, LIABILITY_ACCOUNTS.includes(name) ? "LIABILITY" : "ASSET", userId]
  );
  if (inserted.rows.length > 0) return inserted.rows[0].id;

  return (await find()).rows[0].id;
}

export async function resolveAccounts(client: DbClient, account: string, userId: string): Promise<AccountIds> {
  const accountId = await getAccountId(client, account, userId);
  const savingsId = await getAccountId(client, "Savings", userId);
  const debtId = await getAccountId(client, "Debt", userId);
  const receivableId = await getAccountId(client, "Receivable", userId);

  return { accountId, savingsId, debtId, receivableId };
}
