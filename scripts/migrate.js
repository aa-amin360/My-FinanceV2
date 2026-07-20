const { Pool } = require("pg");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("Error: DATABASE_URL environment variable is missing.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
});

const migrationQuery = `
  -- 1. Alter Users Table
  ALTER TABLE users ADD COLUMN IF NOT EXISTS history_initialized BOOLEAN DEFAULT FALSE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

  -- 2. Create Budget Plans Table
  CREATE TABLE IF NOT EXISTS budget_plans (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    target_id VARCHAR(255),
    target_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    note TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    user_id VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 3. Create Savings Goals Table
  CREATE TABLE IF NOT EXISTS savings_goals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    target_amount NUMERIC(15, 2) NOT NULL,
    current_amount NUMERIC(15, 2) DEFAULT 0,
    target_date DATE,
    user_id VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 4. Add Assistant Columns to Savings Goals
  ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS installment_amount NUMERIC(15, 2);
  ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS frequency VARCHAR(50) DEFAULT 'MONTHLY';
  ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS reminder_day INTEGER;

  -- 5. Link Transactions to Savings Goals
  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS savings_goal_id INTEGER REFERENCES savings_goals(id) ON DELETE SET NULL;
`;

async function runMigrations() {
  console.log("Starting database migrations...");
  const client = await pool.connect();
  try {
    await client.query(migrationQuery);
    console.log("Database migrations successfully executed!");
  } catch (err) {
    console.error("Database migrations failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();