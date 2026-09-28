export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { totalHandler } from "@/lib/obligationRoutes";

export const GET = totalHandler("receivables");
