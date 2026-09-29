import { readJson, searchParams } from "@/backend/http/request";
import { ok, route } from "@/backend/http/response";
import { requireUserId } from "@/backend/http/session";
import { createGoal, listGoals, removeGoal, updateGoal } from "@/backend/services/savings";
import { dateOrToday, parseEnum, parseId } from "@/backend/validators/common";
import { GOAL_DELETE_ACTIONS, parseGoalInput } from "@/backend/validators/savings";

// GET /api/savings
export const getGoals = route("GET SAVINGS ERROR", async () => {
  const userId = await requireUserId();
  return ok({ data: await listGoals(userId) });
});

// POST /api/savings
export const postGoal = route("SAVINGS POST ERROR", async (req) => {
  const userId = await requireUserId();
  return ok({ data: await createGoal(userId, parseGoalInput(await readJson(req))) });
});

// PUT /api/savings/:id
export const putGoal = route("UPDATE GOAL ERROR", async (req, { params }) => {
  const userId = await requireUserId();
  const id = parseId(params.id, "Savings goal");
  return ok({ data: await updateGoal(userId, id, parseGoalInput(await readJson(req))) });
});

// DELETE /api/savings/:id?action=REFUND|SPENT&date=YYYY-MM-DD
export const deleteGoalById = route("DELETE GOAL ERROR", async (req, { params }) => {
  const userId = await requireUserId();
  const query = searchParams(req);
  await removeGoal(
    userId,
    parseId(params.id, "Savings goal"),
    parseEnum(query.get("action") || "REFUND", GOAL_DELETE_ACTIONS, "Action"),
    dateOrToday(query.get("date"))
  );
  return ok({ message: "Goal removed and ledger adjusted." });
});
