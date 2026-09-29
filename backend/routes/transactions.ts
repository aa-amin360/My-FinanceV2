import pool, { withTransaction } from "@/backend/db/pool";
import { readJson, searchParams } from "@/backend/http/request";
import { ok, route } from "@/backend/http/response";
import { requireUserId } from "@/backend/http/session";
import { createTransaction } from "@/backend/services/transactions/create";
import { listTransactions } from "@/backend/services/transactions/list";
import { deleteTransaction, resetLedger } from "@/backend/services/transactions/remove";
import {
  parseCreateTransaction,
  parseTransactionId,
  parseTransactionListQuery,
} from "@/backend/validators/transactions";

// GET /api/transactions
// Query params:
//   page, limit       pagination over top-level transactions (limit max 100)
//   all=true          return every matching transaction (no pagination)
//   search            keyword in note, category or counterparty
//   startDate/endDate YYYY-MM-DD bounds
//   type              only this transaction type
//   entityId          only this counterparty
export const getTransactions = route("GET TRANSACTIONS ERROR", async (req) => {
  const userId = await requireUserId();
  const query = parseTransactionListQuery(searchParams(req));
  return ok(await listTransactions(pool, userId, query));
});

// POST /api/transactions
export const postTransaction = route("CREATE TRANSACTION ERROR", async (req) => {
  const userId = await requireUserId();
  const input = parseCreateTransaction(await readJson(req));
  await withTransaction((client) => createTransaction(client, userId, input));
  return ok();
});

// DELETE /api/transactions/:id
export const deleteTransactionById = route("DELETE TRANSACTION ERROR", async (_req, { params }) => {
  const userId = await requireUserId();
  const id = parseTransactionId(params.id);
  await withTransaction((client) => deleteTransaction(client, userId, id));
  return ok();
});

// DELETE /api/transactions/all
export const deleteAllTransactions = route("DELETE ALL TRANSACTIONS ERROR", async () => {
  const userId = await requireUserId();
  await withTransaction((client) => resetLedger(client, userId));
  return ok({ message: "User ledger reset successfully" });
});
