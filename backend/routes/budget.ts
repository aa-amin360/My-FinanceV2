import { readJson, searchParams } from "@/backend/http/request";
import { ok, route } from "@/backend/http/response";
import { requireUserId } from "@/backend/http/session";
import { createPlan, deletePlan, listPlans, processPlan, updatePlan } from "@/backend/services/budget";
import { parseMonthQuery, parseNewPlan, parsePlanUpdate, parseProcessPlan } from "@/backend/validators/budget";
import { parseId } from "@/backend/validators/common";

// GET /api/budget?month=&year=
export const getPlans = route("GET BUDGET PLANS ERROR", async (req) => {
  const userId = await requireUserId();
  const { month, year } = parseMonthQuery(searchParams(req));
  return ok({ data: await listPlans(userId, month, year) });
});

// POST /api/budget
export const postPlan = route("CREATE BUDGET PLAN ERROR", async (req) => {
  const userId = await requireUserId();
  return ok({ data: await createPlan(userId, parseNewPlan(await readJson(req))) });
});

// PUT /api/budget/:id
export const putPlan = route("UPDATE BUDGET PLAN ERROR", async (req, { params }) => {
  const userId = await requireUserId();
  const id = parseId(params.id, "Plan");
  return ok({ data: await updatePlan(userId, id, parsePlanUpdate(await readJson(req))) });
});

// DELETE /api/budget/:id
export const deletePlanById = route("DELETE BUDGET PLAN ERROR", async (_req, { params }) => {
  const userId = await requireUserId();
  await deletePlan(userId, parseId(params.id, "Plan"));
  return ok({ message: "Plan deleted successfully." });
});

// POST /api/budget/:id/process
export const postProcessPlan = route("PROCESS BUDGET PLAN ERROR", async (req, { params }) => {
  const userId = await requireUserId();
  const id = parseId(params.id, "Plan");
  await processPlan(userId, id, parseProcessPlan(await readJson(req)));
  return ok();
});
