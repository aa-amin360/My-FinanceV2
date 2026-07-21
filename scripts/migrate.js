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
  -- 1. Drop existing tables if they exist to prevent foreign key conflicts during reset
  DROP TABLE IF EXISTS debts CASCADE;
  DROP TABLE IF EXISTS receivables CASCADE;
  DROP TABLE IF EXISTS transactions CASCADE;
  DROP TABLE IF EXISTS budget_plans CASCADE;
  DROP TABLE IF EXISTS savings_goals CASCADE;
  DROP TABLE IF EXISTS categories CASCADE;
  DROP TABLE IF EXISTS entities CASCADE;
  DROP TABLE IF EXISTS accounts CASCADE;
  DROP TABLE IF EXISTS users CASCADE;

  -- 2. Create Users Table with UUID Primary Key
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    image VARCHAR(255),
    history_initialized BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 3. Create Accounts Table with UUID Foreign Key
  CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 4. Create Entities Table with UUID Foreign Key
  CREATE TABLE IF NOT EXISTS entities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 5. Create Categories Table with UUID Foreign Key
  CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 6. Create Savings Goals Table with UUID Foreign Key
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

  -- 7. Create Budget Plans Table with UUID Foreign Key
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

  -- 8. Create Transactions Table with UUID Foreign Key
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

  -- 9. Create Debts Table with UUID Foreign Key
  CREATE TABLE IF NOT EXISTS debts (
    entity_id INTEGER REFERENCES entities(id) ON DELETE CASCADE,
    total_amount NUMERIC(15, 2) NOT NULL,
    remaining_amount NUMERIC(15, 2) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (entity_id, user_id)
  );

  -- 10. Create Receivables Table with UUID Foreign Key
  CREATE TABLE IF NOT EXISTS receivables (
    entity_id INTEGER REFERENCES entities(id) ON DELETE CASCADE,
    total_amount NUMERIC(15, 2) NOT NULL,
    remaining_amount NUMERIC(15, 2) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (entity_id, user_id)
  );
`;

async function runMigrations() {
  console.log("Re-initializing database with UUID schemas...");
  const client = await pool.connect();
  try {
    await client.query(migrationQuery);
    console.log("Database successfully reset and rebuilt with UUID schemas!");
  } catch (err) {
    console.error("Database schema re-initialization failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();