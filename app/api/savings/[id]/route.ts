// Route wiring only: handlers live in backend/routes
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export { putGoal as PUT, deleteGoalById as DELETE } from "@/backend/routes/savings";
