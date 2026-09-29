// Route wiring only: handlers live in backend/routes
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export { getCategories as GET, postCategory as POST } from "@/backend/routes/categories";
