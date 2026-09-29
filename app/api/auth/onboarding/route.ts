// Route wiring only: handlers live in backend/routes
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export { getOnboarding as GET, postOnboarding as POST } from "@/backend/routes/auth";
