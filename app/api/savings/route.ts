// Route wiring only: handlers live in backend/routes
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export { getGoals as GET, postGoal as POST } from "@/backend/routes/savings";
