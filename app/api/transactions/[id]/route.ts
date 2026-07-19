export const runtime = "nodejs";

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const id = params.id;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // =========================
    // 1. Fetch transaction
    // =========================
    const txRes = await client.query(
      `SELECT * FROM transactions WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (txRes.rows.length === 0) {
      throw new Error("Transaction not found");
    }

    const t = txRes.rows[0];

    // =========================
    // 2. SAFETY RULES
    // =========================

    // 🚫 Cannot delete child directly
    if (t.parent_id) {
      throw new Error("Cannot delete auto-generated transaction directly");
    }

    // 🔍 Check children
    const childrenRes = await client.query(
      `SELECT id FROM transactions WHERE parent_id = $1 AND user_id = $2`,
      [t.id, userId]
    );

    const hasChildren = childrenRes.rows.length > 0;

    // 🚫 Block deleting root debt if it has dependent flows
    if (hasChildren && t.type === "DEBT_TAKEN") {
      throw new Error("Cannot delete base debt while dependent records exist");
    }

    // ==========================================
    // SAVINGS GOAL PROGRESS REVERSAL REMOVED
    // (Because it is now calculated dynamically from ledger on GET)
    // ==========================================

    // =========================
    // 3. DELETE CHILDREN
    // =========================
    if (hasChildren) {
      await client.query(
        `DELETE FROM transactions WHERE parent_id = $1 AND user_id = $2`,
        [t.id, userId]
      );
    }

    // =========================
    // 4. DELETE MAIN
    // =========================
    await client.query(
      `DELETE FROM transactions WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    // =========================
    // 5. REBUILD STATE
    // =========================
    if (t.entity_id) {
      // Clear existing state
      await client.query(
        `DELETE FROM debts WHERE entity_id = $1 AND user_id = $2`,
        [t.entity_id, userId]
      );

      await client.query(
        `DELETE FROM receivables WHERE entity_id = $1 AND user_id = $2`,
        [t.entity_id, userId]
      );

      // Rebuild from history
      const history = await client.query(
        `
        SELECT * FROM transactions
        WHERE entity_id = $1 AND user_id = $2
          AND (
            parent_id IS NOT NULL
            OR id NOT IN (
              SELECT DISTINCT parent_id 
              FROM transactions 
              WHERE parent_id IS NOT NULL 
                AND user_id = $3
                AND parent_id IN (
                  SELECT id FROM transactions 
                  WHERE type IN ('DEBT_REPAID', 'RECEIVABLE_RECEIVED')
                )
            )
          )
        ORDER BY date ASC, created_at ASC
        `,
        [t.entity_id, userId, userId]
      );

      for (const h of history.rows) {
        const amt = Number(h.amount);

        if (h.type === "DEBT_TAKEN") {
          await client.query(
            `
            INSERT INTO debts (entity_id, total_amount, remaining_amount, user_id)
            VALUES ($1,$2,$2,$3)
            ON CONFLICT (entity_id, user_id)
            DO UPDATE SET
              total_amount = debts.total_amount + $2,
              remaining_amount = debts.remaining_amount + $2
            `,
            [h.entity_id, amt, userId]
          );
        }

        if (h.type === "DEBT_REPAID") {
          await client.query(
            `
            UPDATE debts
            SET remaining_amount = remaining_amount - $2
            WHERE entity_id = $1 AND user_id = $3
            `,
            [h.entity_id, amt, userId]
          );
        }

        if (h.type === "RECEIVABLE_GIVEN") {
          await client.query(
            `
            INSERT INTO receivables (entity_id, total_amount, remaining_amount, user_id)
            VALUES ($1,$2,$2,$3)
            ON CONFLICT (entity_id, user_id)
            DO UPDATE SET
              total_amount = receivables.total_amount + $2,
              remaining_amount = receivables.remaining_amount + $2
            `,
            [h.entity_id, amt, userId]
          );
        }

        if (h.type === "RECEIVABLE_RECEIVED") {
          await client.query(
            `
            UPDATE receivables
            SET remaining_amount = remaining_amount - $2
            WHERE entity_id = $1 AND user_id = $3
            `,
            [h.entity_id, amt, userId]
          );
        }
      }
      
      // Clean up any fully settled records
      await client.query(
        `DELETE FROM debts
         WHERE entity_id = $1 AND user_id = $2 AND remaining_amount <= 0`,
        [t.entity_id, userId]
      );

      await client.query(
        `DELETE FROM receivables
         WHERE entity_id = $1 AND user_id = $2 AND remaining_amount <= 0`,
        [t.entity_id, userId]
      );
      
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