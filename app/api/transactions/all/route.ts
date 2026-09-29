// Route wiring only: handlers live in backend/routes
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export { deleteAllTransactions as DELETE } from "@/backend/routes/transactions";
