// Route wiring only: handlers live in backend/routes
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export { putPlan as PUT, deletePlanById as DELETE } from "@/backend/routes/budget";
