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
| `npm run lint` | ESLint, including the frontend/backend import boundaries |
| `npm run typecheck` | TypeScript in strict mode |
| `npm test` | Unit tests (Vitest) |
| `npm run db:migrate` | Apply the schema migration using `.env.local` |

`backend/db/reset.js` drops **every table**. It refuses to run unless you pass `--confirm-wipe-all-data`, and it is only meant for throwaway development databases.

## Project structure

It is one Next.js app deployed as a single unit (e.g. on Vercel), with the code split by responsibility:

```
app/                 Next.js routing only
  (app)/             signed-in pages; the group name is not part of the URL
    layout.tsx       shared shell (sidebar, header) that stays mounted while navigating
    template.tsx     replays the page entrance animation on every navigation
  */page.tsx         one line each: render a screen from frontend/screens
  api/**/route.ts    one line each: export handlers from backend/routes

frontend/            everything that runs in the browser
  screens/           one component per page; owns the page's state and composes components
  components/        atomic design
    atoms/           smallest pieces: Heading, TextInput, FieldLabel, BackButton, SignedAmount, badges...
    molecules/       small groups of atoms: PageHeader, Dropdown, ModalOverlay, TransactionRow, PlanCard...
    organisms/       self-contained sections: TransactionList, Sidebar, TransactionModal, BudgetProjection...
      landing/       sections of the public landing page
      onboarding/    steps of the onboarding wizard
    templates/       page shells (DashboardLayout)
  api/               typed API client, one module per resource (transactionsApi, budgetApi...)
  hooks/             useRefresh, useClickOutside, useOnboardingGate
  lib/               UI helpers: formatting, navigation, calendar, app events
  providers/         React context providers (theme)

backend/             everything that runs on the server
  routes/            HTTP handlers: authenticate -> validate -> call a service -> respond
  validators/        request parsing and validation, one file per resource
  services/          business rules (ledger, settlements, budget processing, savings...)
  repositories/      all SQL, one file per table or resource
  auth/              NextAuth options, password hashing, rate limiting
  http/              AppError, JSON responses, request parsing, session
  db/                connection pool, withTransaction, migrate/reset scripts

shared/              used by both sides: API types, ledger rules, money math, config

tests/               unit tests mirroring backend/, frontend/ and shared/
```

Dependency rules, enforced by `npm run lint`:

- `frontend/` never imports `backend/`. It talks to the server only through `frontend/api`.
- `backend/` never imports `frontend/`.
- `shared/` imports from neither.

A backend request flows like this: `app/api/.../route.ts` → `backend/routes` → `backend/validators` → `backend/services` → `backend/repositories`. Services and repositories take a `Db` (the pool or a transaction client), so the same functions work inside `withTransaction`.

## Animations

- Keyframes and `animate-*` utilities are defined in `tailwind.config.js`: `pageIn`, `fadeIn`, `rise`, `modalIn`/`modalOut`, `popIn`/`popOut`, `slideDown`, `progress`.
- Add the `stagger` class to a list container to make its items rise in one after another.
- Wrap anything that opens and closes (dialogs, dropdowns) in `<Presence show={...}>` so it animates out as well as in.
- `useCountUp` animates numbers to new values, and `TopProgressBar` shows while API requests are running.
- Everything respects the OS "reduce motion" setting (see `app/globals.css`).

## How the ledger works

- Every transaction moves money between accounts (`from_account` to `to_account`). Balances are always computed from the transactions, never stored.
- Users pick **Cash** or **Bank**. **Savings**, **Debt** and **Receivable** are internal accounts.
- `debts` and `receivables` hold the running outstanding amount per counterparty and are rebuilt from history whenever a related transaction is deleted.
- A repayment is stored as a child of the transaction that created the obligation. These can be deleted individually.
- An overpayment is stored as a split: a parent with the full amount, plus automatic children for the settled part and for the remainder converted into the opposite obligation. The split parent is excluded from balances (`shared/ledger.ts`).
- `transactions.source` marks system-generated rows such as opening balances and automatic conversions.
