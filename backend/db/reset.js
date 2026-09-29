// DESTRUCTIVE: drops every table and all data.
// Only for throwaway development databases. Recreate the schema afterwards with
// `npm run db:migrate`.
//
// Usage: node --env-file=.env.local backend/db/reset.js --confirm-wipe-all-data

const { Pool } = require("pg");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Error: DATABASE_URL environment variable is missing.");
  process.exit(1);
}

if (!process.argv.includes("--confirm-wipe-all-data")) {
  const host = new URL(databaseUrl).host;
  console.error(
    `Refusing to run. This permanently deletes ALL data in ${host}.\n` +
      "Re-run with --confirm-wipe-all-data if that is really what you want."
  );
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

const dropQuery = `
  DROP TABLE IF EXISTS debts CASCADE;
  DROP TABLE IF EXISTS receivables CASCADE;
  DROP TABLE IF EXISTS transactions CASCADE;
  DROP TABLE IF EXISTS budget_plans CASCADE;
  DROP TABLE IF EXISTS savings_goals CASCADE;
  DROP TABLE IF EXISTS categories CASCADE;
  DROP TABLE IF EXISTS entities CASCADE;
  DROP TABLE IF EXISTS accounts CASCADE;
  DROP TABLE IF EXISTS users CASCADE;
`;

async function run() {
  try {
    await pool.query(dropQuery);
    console.log("All tables dropped. Run `npm run db:migrate` to recreate the schema.");
  } catch (err) {
    console.error("Reset failed:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
