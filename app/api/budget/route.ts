// Route wiring only: handlers live in backend/routes
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export { getPlans as GET, postPlan as POST } from "@/backend/routes/budget";
