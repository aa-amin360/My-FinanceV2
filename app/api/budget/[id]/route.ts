export const runtime = "nodejs";

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ==========================================
// UPDATE A SPECIFIC BUDGET PLAN (DYNAMIC)
// ==========================================
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session: any = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const id = params.id;
  const client = await pool.connect();

  try {
    const body = await req.json();
    const { status, amount, date, note, target_name, target_id } = body;

    // Dynamically compile fields to build an optimized UPDATE query
    const fields: string[] = [];
    const values: any[] = [];
    let valIndex = 1;

    if (status !== undefined) {
      fields.push(`status = $${valIndex++}`);
      values.push(status);
    }
    if (amount !== undefined) {
      fields.push(`amount = $${valIndex++}`);
      values.push(Number(amount));
    }
    if (date !== undefined) {
      fields.push(`date = $${valIndex++}`);
      values.push(date);
    }
    if (note !== undefined) {
      fields.push(`note = $${valIndex++}`);
      values.push(note);
    }
    if (target_name !== undefined) {
      fields.push(`target_name = $${valIndex++}`);
      values.push(target_name);
    }
    if (target_id !== undefined) {
      fields.push(`target_id = $${valIndex++}`);
      values.push(target_id || null);
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: "No update fields provided." },
        { status: 400 }
      );
    }

    // Append ID and User Email to parameters
    values.push(id);
    values.push(userId);

    const query = `
      UPDATE budget_plans
      SET ${fields.join(", ")}
      WHERE id = $${valIndex++} AND user_id = $${valIndex++}
      RETURNING *
    `;

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Plan not found or unauthorized." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });

  } catch (err: any) {
    console.error("UPDATE BUDGET PLAN ERROR:", err);
    return NextResponse.json(
      { error: "Failed to update budget plan." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// ==========================================
// DELETE A SPECIFIC BUDGET PLAN
// ==========================================
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session: any = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const id = params.id;
  const client = await pool.connect();

  try {
    const result = await client.query(
      `
      DELETE FROM budget_plans
      WHERE id = $1 AND user_id = $2
      RETURNING id
      `,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Plan not found or unauthorized." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Plan deleted successfully.",
    });

  } catch (err: any) {
    console.error("DELETE BUDGET PLAN ERROR:", err);
    return NextResponse.json(
      { error: "Failed to delete budget plan." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}