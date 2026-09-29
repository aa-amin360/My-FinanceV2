import { readJson } from "@/backend/http/request";
import { ok, route } from "@/backend/http/response";
import { requireUserId } from "@/backend/http/session";
import { getOpeningBalanceStatus, recordHistory } from "@/backend/services/history";
import { parseHistoryInput } from "@/backend/validators/history";

// GET /api/transactions/history
export const getHistoryStatus = route("GET HISTORY STATUS ERROR", async () => {
  const userId = await requireUserId();
  return ok(await getOpeningBalanceStatus(userId));
});

// POST /api/transactions/history
export const postHistory = route("POST HISTORY ERROR", async (req) => {
  const userId = await requireUserId();
  await recordHistory(userId, parseHistoryInput(await readJson(req)));
  return ok({ message: "Historical positions recorded successfully." });
});
