export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { errorResponse, requireUserId } from "@/lib/api";
import { deleteTransaction } from "@/lib/transactions/remove";
import { parseId } from "@/lib/validation";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const id = parseId(params.id, "Transaction");

    await withTransaction((client) => deleteTransaction(client, userId, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err, "DELETE TRANSACTION ERROR");
  }
}
