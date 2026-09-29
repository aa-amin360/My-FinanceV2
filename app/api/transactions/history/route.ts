// Route wiring only: handlers live in backend/routes
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export { getHistoryStatus as GET, postHistory as POST } from "@/backend/routes/history";
