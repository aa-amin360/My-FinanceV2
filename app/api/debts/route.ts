// Route wiring only: handlers live in backend/routes
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getObligationTotal } from "@/backend/routes/obligations";

export const GET = getObligationTotal("debts");
