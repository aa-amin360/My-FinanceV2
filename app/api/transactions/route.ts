// Route wiring only: handlers live in backend/routes
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export { getTransactions as GET, postTransaction as POST } from "@/backend/routes/transactions";
