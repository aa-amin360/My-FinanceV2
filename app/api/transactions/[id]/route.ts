// Route wiring only: handlers live in backend/routes
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export { deleteTransactionById as DELETE } from "@/backend/routes/transactions";
