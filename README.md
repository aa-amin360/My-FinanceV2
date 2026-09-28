# My Finance

A personal finance tracker for income, expenses, savings goals, debts, receivables and monthly budget planning.

Built with Next.js 14 (App Router), NextAuth (Google + email/password), PostgreSQL (`pg`), Tailwind CSS and Recharts.

## Getting started

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Copy `.env.example` to `.env.local` and fill in the values:

   | Variable | Required | Purpose |
   | --- | --- | --- |
   | `DATABASE_URL` | yes | PostgreSQL connection string (e.g. Neon, with `?sslmode=require`) |
   | `NEXTAUTH_URL` | yes | Base URL of the app, e.g. `http://localhost:3000` |
   | `NEXTAUTH_SECRET` | yes | Random secret used to sign sessions |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | no | Enables "Continue with Google" (redirect URI: `<NEXTAUTH_URL>/api/auth/callback/google`) |
   | `NEXT_PUBLIC_CURRENCY` | no | Currency label shown in the UI (default `Tk`) |
   | `NEXT_PUBLIC_NUMBER_LOCALE` | no | Number formatting locale (default `en-BD`) |

3. Create or update the database schema:

   ```bash
   npm run db:migrate
   ```

   The migration is additive and safe to run repeatedly against an existing database. It never drops data.

4. Start the dev server:

   ```bash
   npm run dev
   ```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint (`next/core-web-vitals`) |
| `npm run typecheck` | TypeScript in strict mode |
| `npm test` | Unit tests (Vitest) |
| `npm run db:migrate` | Apply the schema migration using `.env.local` |

`scripts/reset-db.js` drops **every table**. It refuses to run unless you pass `--confirm-wipe-all-data`, and it is only meant for throwaway development databases.

## How the ledger works

- Every transaction moves money between accounts (`from_account` to `to_account`). Balances are always computed from the transactions, never stored.
- Users pick **Cash** or **Bank**. **Savings**, **Debt** and **Receivable** are internal accounts.
- `debts` and `receivables` hold the running outstanding amount per counterparty and are rebuilt from history whenever a related transaction is deleted.
- A repayment is stored as a child of the transaction that created the obligation. These can be deleted individually.
- An overpayment is stored as a split: a parent with the full amount, plus automatic children for the settled part and for the remainder converted into the opposite obligation. The split parent is excluded from balances (`lib/ledger.ts`).
- `transactions.source` marks system-generated rows such as opening balances and automatic conversions.

## Project layout

```
app/            pages and API routes (app/api/**)
components/     UI components
lib/            server and shared logic
  transactions/ create, settle and delete transactions
  ledger.ts     ledger rules shared by API and UI
  validation.ts request validation helpers
scripts/        database migration and reset scripts
tests/          unit tests
```
