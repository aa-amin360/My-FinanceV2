export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const id = params.id;

    const tx = await client.query(
      `SELECT * FROM transactions WHERE id = $1`,
      [id]
    );

    if (tx.rows.length === 0) {
      throw new Error("Transaction not found");
    }

    const t = tx.rows[0];

    if (t.parent_id) {
      return NextResponse.json(
        { error: "Cannot delete auto-generated transaction" },
        { status: 400 }
      );
    }

    // BLOCK deleting root if it has children
    const hasChildren = await client.query(
      `SELECT 1 FROM transactions WHERE parent_id = $1 LIMIT 1`,
      [t.id]
    );
    
    if (hasChildren.rows.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete this transaction because it has dependent records" },
        { status: 400 }
      );
    }

    // 🔥 HANDLE LINKED (CHILD) TRANSACTIONS
    const children = await client.query(
      `SELECT * FROM transactions WHERE parent_id = $1`,
      [t.id]
    );
    
    for (const child of children.rows) {
      const amt = Number(child.amount);
    
      if (child.type === "RECEIVABLE_GIVEN") {
        await client.query(
          `UPDATE receivables
           SET total_amount = total_amount - $2,
               remaining_amount = remaining_amount - $2
           WHERE entity_id = $1`,
          [child.entity_id, amt]
        );
      }
    
      if (child.type === "DEBT_TAKEN") {
        await client.query(
          `UPDATE debts
           SET total_amount = total_amount - $2,
               remaining_amount = remaining_amount - $2
           WHERE entity_id = $1`,
          [child.entity_id, amt]
        );
      }
    
      await client.query(
        `DELETE FROM transactions WHERE id = $1`,
        [child.id]
      );
    }
    
    const amount = Number(t.amount);

    // ===== REVERSE EFFECT =====

    if (t.entity_id) {
      if (t.type === "DEBT_TAKEN") {
        await client.query(
          `UPDATE debts 
           SET total_amount = total_amount - $2,
               remaining_amount = remaining_amount - $2
           WHERE entity_id = $1`,
          [t.entity_id, amount]
        );
      }

      if (t.type === "DEBT_REPAID") {
        await client.query(
          `UPDATE debts 
           SET remaining_amount = remaining_amount + $2
           WHERE entity_id = $1`,
          [t.entity_id, amount]
        );
      }

      if (t.type === "RECEIVABLE_GIVEN") {
        await client.query(
          `UPDATE receivables 
           SET total_amount = total_amount - $2,
               remaining_amount = remaining_amount - $2
           WHERE entity_id = $1`,
          [t.entity_id, amount]
        );
      }

      if (t.type === "RECEIVABLE_RECEIVED") {
        await client.query(
          `UPDATE receivables 
           SET remaining_amount = remaining_amount + $2
           WHERE entity_id = $1`,
          [t.entity_id, amount]
        );
      }
      // ===== CLEANUP EMPTY RECORDS =====
            
      // DEBT CLEANUP
      await client.query(
        `DELETE FROM debts
         WHERE entity_id = $1 AND remaining_amount <= 0`,
        [t.entity_id]
      );
      
      // RECEIVABLE CLEANUP
      await client.query(
        `DELETE FROM receivables
         WHERE entity_id = $1 AND remaining_amount <= 0`,
        [t.entity_id]
      );
    }

    // ===== DELETE =====
    await client.query(
      `DELETE FROM transactions WHERE id = $1`,
      [id]
    );

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
