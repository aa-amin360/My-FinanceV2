import { Pool, PoolClient, types } from "pg";

// Return Postgres DATE columns as plain "YYYY-MM-DD" strings instead of JS Dates.
// The default parser builds a Date at local midnight of the server, which shifts
// the day when the server runs in a non-UTC timezone (e.g. local development).
types.setTypeParser(1082, (value: string) => value);

declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

// Reuse a single pool across hot reloads in development
const pool: Pool = globalThis.pgPool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  globalThis.pgPool = pool;
}

// Anything that can run a query: the shared pool, or a client inside a transaction.
// Repositories accept this so they work both standalone and inside withTransaction.
export type Db = Pool | PoolClient;
export type DbClient = PoolClient;

// Run `fn` inside a BEGIN/COMMIT block, rolling back on any error and always
// releasing the client back to the pool.
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
