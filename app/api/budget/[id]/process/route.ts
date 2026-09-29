// Route wiring only: handlers live in backend/routes
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export { postProcessPlan as POST } from "@/backend/routes/budget";
