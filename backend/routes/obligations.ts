import pool from "@/backend/db/pool";
import { ok, route } from "@/backend/http/response";
import { requireUserId } from "@/backend/http/session";
import { getTotalRemaining, listObligations, ObligationTable } from "@/backend/repositories/obligations";

// Handlers shared by /api/debts and /api/receivables

// GET /api/debts, /api/receivables -> { total }
export function getObligationTotal(table: ObligationTable) {
  return route(`${table.toUpperCase()} TOTAL ERROR`, async () => {
    const userId = await requireUserId();
    return ok({ total: await getTotalRemaining(pool, table, userId) });
  });
}

// GET /api/debts/details, /api/receivables/details -> { data: [...] }
export function getObligationDetails(table: ObligationTable) {
  return route(`${table.toUpperCase()} DETAILS ERROR`, async () => {
    const userId = await requireUserId();
    return ok({ data: await listObligations(pool, table, userId) });
  });
}
