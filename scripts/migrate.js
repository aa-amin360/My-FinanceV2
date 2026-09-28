// Safe, repeatable schema migration.
//
// Every statement is additive and idempotent (IF NOT EXISTS / NOT VALID), so it can
// run against a live database without touching existing rows other than a one-time
// backfill of transactions.source. It never drops anything.
//
// Usage: npm run db:migrate   (reads DATABASE_URL from .env.local)
//        DATABASE_URL=... node scripts/migrate.js

const { Pool } = require("pg");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Error: DATABASE_URL environment variable is missing.");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

// 1. Base tables for a fresh database
const createTables = `
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    image VARCHAR(255),
    history_initialized BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS entities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS savings_goals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    target_amount NUMERIC(15, 2) NOT NULL,
    current_amount NUMERIC(15, 2) DEFAULT 0,
    target_date DATE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    installment_amount NUMERIC(15, 2),
    frequency VARCHAR(50) DEFAULT 'MONTHLY',
    reminder_day INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS budget_plans (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    target_id VARCHAR(255),
    target_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    note TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    from_account INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    to_account INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    entity_id INTEGER REFERENCES entities(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    note TEXT,
    parent_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    savings_goal_id INTEGER REFERENCES savings_goals(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS debts (
    entity_id INTEGER REFERENCES entities(id) ON DELETE CASCADE,
    total_amount NUMERIC(15, 2) NOT NULL,
    remaining_amount NUMERIC(15, 2) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (entity_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS receivables (
    entity_id INTEGER REFERENCES entities(id) ON DELETE CASCADE,
    total_amount NUMERIC(15, 2) NOT NULL,
    remaining_amount NUMERIC(15, 2) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (entity_id, user_id)
  );
`;

// 2. transactions.source marks system-generated rows (opening balances etc.)
//    instead of relying on the free-text note
const addSourceColumn = `
  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source VARCHAR(30);

  UPDATE transactions SET source = 'OPENING_BALANCE'
  WHERE source IS NULL AND note = 'Opening Balance' AND type = 'INCOME' AND from_account IS NULL;

  UPDATE transactions SET source = 'OPENING_DEBT'
  WHERE source IS NULL AND note = 'Opening Debt' AND type = 'DEBT_TAKEN' AND to_account IS NULL;

  UPDATE transactions SET source = 'OPENING_RECEIVABLE'
  WHERE source IS NULL AND note = 'Opening Receivable' AND type = 'RECEIVABLE_GIVEN' AND from_account IS NULL;

  UPDATE transactions SET source = 'AUTO_CONVERSION'
  WHERE source IS NULL AND note = 'Auto conversion' AND parent_id IS NOT NULL;
`;

// 3. Indexes for the queries the app runs on every page
const createIndexes = `
  CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions (user_id, date DESC, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_transactions_parent ON transactions (parent_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_user_entity ON transactions (user_id, entity_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_savings_goal ON transactions (savings_goal_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_user_source ON transactions (user_id, source);
  CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts (user_id);
  CREATE INDEX IF NOT EXISTS idx_entities_user ON entities (user_id);
  CREATE INDEX IF NOT EXISTS idx_categories_user ON categories (user_id);
  CREATE INDEX IF NOT EXISTS idx_budget_plans_user_date ON budget_plans (user_id, date);
  CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON savings_goals (user_id);
`;

// 4. Positive-amount checks. NOT VALID enforces them for new rows without
//    scanning (or failing on) existing data.
const checkConstraints = [
  ["transactions", "chk_transactions_amount_positive", "amount > 0"],
  ["budget_plans", "chk_budget_plans_amount_positive", "amount > 0"],
  ["savings_goals", "chk_savings_goals_target_positive", "target_amount > 0"],
];

// 5. Uniqueness that prevents duplicate accounts/counterparties under concurrency.
//    Skipped with a warning if existing duplicates would make it fail.
const uniqueIndexes = [
  {
    name: "uq_accounts_user_name",
    sql: "CREATE UNIQUE INDEX IF NOT EXISTS uq_accounts_user_name ON accounts (user_id, LOWER(TRIM(name)))",
    duplicates: `SELECT user_id, LOWER(TRIM(name)) AS name, COUNT(*) FROM accounts
                 GROUP BY 1, 2 HAVING COUNT(*) > 1`,
  },
  {
    name: "uq_entities_user_name",
    sql: "CREATE UNIQUE INDEX IF NOT EXISTS uq_entities_user_name ON entities (user_id, LOWER(name))",
    duplicates: `SELECT user_id, LOWER(name) AS name, COUNT(*) FROM entities
                 GROUP BY 1, 2 HAVING COUNT(*) > 1`,
  },
];

async function run() {
  const client = await pool.connect();
  try {
    console.log("Creating missing tables...");
    await client.query(createTables);

    console.log("Adding transactions.source and backfilling...");
    await client.query(addSourceColumn);

    console.log("Creating indexes...");
    await client.query(createIndexes);

    for (const [table, name, expression] of checkConstraints) {
      const exists = await client.query("SELECT 1 FROM pg_constraint WHERE conname = $1", [name]);
      if (exists.rows.length === 0) {
        console.log(`Adding constraint ${name}...`);
        await client.query(`ALTER TABLE ${table} ADD CONSTRAINT ${name} CHECK (${expression}) NOT VALID`);
      }
    }

    for (const index of uniqueIndexes) {
      const dupes = await client.query(index.duplicates);
      if (dupes.rows.length > 0) {
        console.warn(
          `WARNING: skipped ${index.name} because ${dupes.rows.length} duplicate group(s) exist. ` +
            "Merge the duplicates and run the migration again."
        );
        continue;
      }
      await client.query(index.sql);
    }

    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
