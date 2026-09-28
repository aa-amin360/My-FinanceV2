export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { detailsHandler } from "@/lib/obligationRoutes";

export const GET = detailsHandler("debts");
