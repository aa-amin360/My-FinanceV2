import type { Db } from "@/backend/db/pool";

// Internal ledger accounts that represent money the user owes
const LIABILITY_ACCOUNTS = ["Debt"];

export type AccountIds = {
  accountId: number;
  savingsId: number;
  debtId: number;
  receivableId: number;
};

export async function findAccountId(db: Db, name: string, userId: string): Promise<number | null> {
  const res = await db.query(
    `SELECT id FROM accounts
     WHERE user_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2))
     ORDER BY id
     LIMIT 1`,
    [userId, name]
  );
  return res.rows[0]?.id ?? null;
}

// Find or create an account by name. The insert tolerates a concurrent request
// creating the same account (unique index on user_id + name, see backend/db/migrate.js).
export async function getAccountId(db: Db, name: string, userId: string): Promise<number> {
  const existing = await findAccountId(db, name, userId);
  if (existing !== null) return existing;

  const inserted = await db.query(
    `INSERT INTO accounts (name, type, user_id)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [name, LIABILITY_ACCOUNTS.includes(name) ? "LIABILITY" : "ASSET", userId]
  );
  if (inserted.rows.length > 0) return inserted.rows[0].id;

  return (await findAccountId(db, name, userId)) as number;
}

// The chosen spendable account plus the user's internal ledger accounts
export async function resolveAccounts(db: Db, account: string, userId: string): Promise<AccountIds> {
  const accountId = await getAccountId(db, account, userId);
  const savingsId = await getAccountId(db, "Savings", userId);
  const debtId = await getAccountId(db, "Debt", userId);
  const receivableId = await getAccountId(db, "Receivable", userId);

  return { accountId, savingsId, debtId, receivableId };
}

// Row lock that serialises concurrent withdrawals from the same account
export async function lockAccount(db: Db, accountId: number, userId: string) {
  await db.query(`SELECT id FROM accounts WHERE id = $1 AND user_id = $2 FOR UPDATE`, [accountId, userId]);
}
