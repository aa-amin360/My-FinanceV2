import { searchParams } from "@/backend/http/request";
import { ok, route } from "@/backend/http/response";
import { requireUserId } from "@/backend/http/session";
import { getBalances, getReport, getWeeklyExpenses } from "@/backend/services/reports";
import { dateOrToday } from "@/backend/validators/common";
import { parseReportQuery } from "@/backend/validators/reports";

// GET /api/balance
export const getBalance = route("BALANCE ERROR", async () => {
  const userId = await requireUserId();
  return ok(await getBalances(userId));
});

// GET /api/reports?range=ALL|YEAR|MONTH&today=YYYY-MM-DD
export const getReports = route("REPORTS ERROR", async (req) => {
  const userId = await requireUserId();
  const { range, today } = parseReportQuery(searchParams(req));
  return ok(await getReport(userId, range, today));
});

// GET /api/dashboard/weekly-expenses?today=YYYY-MM-DD
// The client passes its local date so the week matches the user's calendar.
export const getWeekly = route("WEEKLY EXPENSES ERROR", async (req) => {
  const userId = await requireUserId();
  const today = dateOrToday(searchParams(req).get("today"));
  return ok({ data: await getWeeklyExpenses(userId, today) });
});
