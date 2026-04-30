import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Pool } from "pg";

import { resolveAccounts } from "@/lib/transactions/accounts";
import { resolveEntity } from "@/lib/transactions/entity";
import { buildFlow } from "@/lib/transactions/flow";
import { checkBalance } from "@/lib/transactions/balance";
import { insertTransaction } from "@/lib/transactions/insert";
import { handleDebt } from "@/lib/transactions/debt";
import { handleReceivable } from "@/lib/transactions/receivable";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const TYPE_META = {
  INCOME: { flow: "IN", group: "BALANCE" },
  EXPENSE: { flow: "OUT", group: "BALANCE" },
  TRANSFER: { flow: "MOVE", group: "BALANCE" },
  DEBT_TAKEN: { flow: "IN", group: "DEBT" },
  DEBT_REPAID: { flow: "OUT", group: "DEBT" },
  RECEIVABLE_GIVEN: { flow: "OUT", group: "RECEIVABLE" },
  RECEIVABLE_RECEIVED: { flow: "IN", group: "RECEIVABLE" },
} as const;

// =========================
// POST
// =========================

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const body = await req.json();

    const {
      type,
      amount,
      account,
      category_id,
      entity,
      date,
      note,
      direction,
    } = body;

    const amountNumber = Number(amount);

    if (!type || !amountNumber || !account || !date) {
      throw new Error("Missing required fields");
    }

    const accounts = await resolveAccounts(client, account, userId);

    const entity_id = await resolveEntity(
      client,
      entity,
      type,
      userId,
      TYPE_META
    );

    const { from_account, to_account } = buildFlow(
      type,
      direction,
      accounts,
      entity_id
    );

    await checkBalance(
      client,
      accounts.accountId,
      userId,
      type,
      amountNumber,
      TYPE_META
    );

    // insert normal
    if (type !== "DEBT_REPAID" && type !== "RECEIVABLE_RECEIVED") {
      await insertTransaction(client, [
        type,
        amountNumber,
        from_account,
        to_account,
        entity_id,
        category_id || null,
        date,
        note,
        userId,
      ]);
    }

    // debt
    const debtResult = await handleDebt({
      client,
      type,
      entity_id,
      amountNumber,
      from_account,
      to_account,
      category_id,
      date,
      note,
      userId,
      receivableId: accounts.receivableId,
    });

    if (debtResult === "COMMIT_EARLY") {
      await client.query("COMMIT");
      return NextResponse.json({ success: true });
    }

    // receivable
    const recResult = await handleReceivable({
      client,
      type,
      entity_id,
      amountNumber,
      from_account,
      to_account,
      category_id,
      date,
      note,
      userId,
      receivableId: accounts.receivableId,
    });

    if (recResult === "COMMIT_EARLY") {
      await client.query("COMMIT");
      return NextResponse.json({ success: true });
    }

    await client.query("COMMIT");

    return NextResponse.json({ success: true });

  } catch (err: any) {
    await client.query("ROLLBACK");

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
