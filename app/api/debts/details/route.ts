// Route wiring only: handlers live in backend/routes
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getObligationDetails } from "@/backend/routes/obligations";

export const GET = getObligationDetails("debts");
