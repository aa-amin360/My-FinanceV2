// Route wiring only: handlers live in backend/routes
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export { postSignup as POST } from "@/backend/routes/auth";
