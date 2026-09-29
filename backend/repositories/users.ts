import type { Db } from "@/backend/db/pool";

export type UserCredentials = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  password_hash: string | null;
};

export async function findUserByEmail(db: Db, email: string): Promise<UserCredentials | null> {
  const res = await db.query(
    "SELECT id, email, name, image, password_hash FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
    [email]
  );
  return res.rows[0] ?? null;
}

export async function updatePasswordHash(db: Db, userId: string, passwordHash: string) {
  await db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, userId]);
}

export async function upsertGoogleUser(
  db: Db,
  user: { email: string; name?: string | null; image?: string | null }
) {
  // id (UUID) is omitted because Postgres generates it with gen_random_uuid()
  await db.query(
    `
    INSERT INTO users (email, name, image)
    VALUES ($1, $2, $3)
    ON CONFLICT (email)
    DO UPDATE SET
      name = EXCLUDED.name,
      image = EXCLUDED.image
    `,
    [user.email, user.name ?? null, user.image ?? null]
  );
}

// Insert a password user unless the email is taken (case-insensitive). Returns the new id or null.
export async function insertPasswordUser(
  db: Db,
  user: { email: string; name: string; passwordHash: string }
): Promise<string | null> {
  const res = await db.query(
    `
    INSERT INTO users (email, name, password_hash)
    SELECT $1::text, $2::text, $3::text
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = $1::text)
    ON CONFLICT (email) DO NOTHING
    RETURNING id
    `,
    [user.email, user.name, user.passwordHash]
  );
  return res.rows[0]?.id ?? null;
}

export async function getOnboardingState(db: Db, userId: string) {
  const res = await db.query(
    `
    SELECT
      u.history_initialized,
      EXISTS (SELECT 1 FROM transactions WHERE user_id = u.id) AS has_transactions
    FROM users u
    WHERE u.id = $1
    `,
    [userId]
  );
  return {
    historyInitialized: Boolean(res.rows[0]?.history_initialized),
    hasTransactions: Boolean(res.rows[0]?.has_transactions),
  };
}

export async function setHistoryInitialized(db: Db, userId: string, value: boolean) {
  await db.query("UPDATE users SET history_initialized = $2 WHERE id = $1", [userId, value]);
}

// Serialise concurrent operations for one user (e.g. setting opening balances)
export async function lockUser(db: Db, userId: string) {
  await db.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [userId]);
}
