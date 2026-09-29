import type { Db } from "@/backend/db/pool";

export type NewPlan = {
  type: string;
  amount: number;
  categoryId: number | null;
  targetName: string;
  date: string;
  note: string | null;
};

// Column name -> new value; only whitelisted columns are ever passed in by the service
export type PlanChanges = Partial<Record<"status" | "amount" | "date" | "note" | "target_name" | "target_id", unknown>>;

export async function listPlansForMonth(db: Db, userId: string, month: number, year: number) {
  const res = await db.query(
    `
    SELECT id, type, amount, target_id, target_name, date, note, status
    FROM budget_plans
    WHERE user_id = $1
      AND EXTRACT(MONTH FROM date) = $2
      AND EXTRACT(YEAR FROM date) = $3
    ORDER BY date ASC, created_at ASC
    `,
    [userId, month, year]
  );
  return res.rows;
}

export async function insertPlan(db: Db, userId: string, plan: NewPlan) {
  const res = await db.query(
    `
    INSERT INTO budget_plans (type, amount, target_id, target_name, date, note, user_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [
      plan.type,
      plan.amount,
      plan.categoryId ? String(plan.categoryId) : null,
      plan.targetName,
      plan.date,
      plan.note,
      userId,
    ]
  );
  return res.rows[0];
}

export async function updatePlan(db: Db, userId: string, id: number, changes: PlanChanges) {
  const columns = Object.keys(changes);
  const values = Object.values(changes);
  const assignments = columns.map((column, index) => `${column} = $${index + 1}`);

  const res = await db.query(
    `
    UPDATE budget_plans
    SET ${assignments.join(", ")}
    WHERE id = $${columns.length + 1} AND user_id = $${columns.length + 2}
    RETURNING *
    `,
    [...values, id, userId]
  );
  return res.rows[0] ?? null;
}

export async function deletePlan(db: Db, userId: string, id: number): Promise<boolean> {
  const res = await db.query(`DELETE FROM budget_plans WHERE id = $1 AND user_id = $2 RETURNING id`, [id, userId]);
  return res.rows.length > 0;
}

export async function findPlan(db: Db, userId: string, id: number, { forUpdate = false } = {}) {
  const res = await db.query(
    `SELECT * FROM budget_plans WHERE id = $1 AND user_id = $2 ${forUpdate ? "FOR UPDATE" : ""}`,
    [id, userId]
  );
  return res.rows[0] ?? null;
}
