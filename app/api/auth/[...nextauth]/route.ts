// Route wiring only: handlers live in backend/routes
export const runtime = "nodejs";

export { nextAuthHandler as GET, nextAuthHandler as POST } from "@/backend/routes/auth";
