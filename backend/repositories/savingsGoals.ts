import type { Db } from "@/backend/db/pool";

export type GoalFields = {
  name: string;
  targetAmount: number;
  installmentAmount: number | null;
  frequency: string;
  reminderDay: number | null;
  targetDate: string | null;
};

// Goals with their progress calculated from transfers into the Savings account
export async function listGoalsWithProgress(db: Db, userId: string) {
  const res = await db.query(
    `
    WITH savings_account AS (
      SELECT id FROM accounts
      WHERE LOWER(TRIM(name)) = 'savings' AND user_id = $1
      ORDER BY id
      LIMIT 1
    )
    SELECT
      sg.id,
      sg.name,
      sg.target_amount,
      sg.target_date,
      sg.installment_amount,
      sg.frequency,
      sg.reminder_day,
      sg.created_at,
      COALESCE(SUM(
        CASE
          WHEN t.to_account = (SELECT id FROM savings_account) THEN t.amount
          WHEN t.from_account = (SELECT id FROM savings_account) THEN -t.amount
          ELSE 0
        END
      ), 0) AS current_amount
    FROM savings_goals sg
    LEFT JOIN transactions t
      ON t.savings_goal_id = sg.id
      AND t.user_id = $1
    WHERE sg.user_id = $1
    GROUP BY sg.id
    ORDER BY sg.created_at DESC
    `,
    [userId]
  );
  return res.rows;
}

export async function insertGoal(db: Db, userId: string, goal: GoalFields) {
  const res = await db.query(
    `INSERT INTO savings_goals
      (name, target_amount, installment_amount, frequency, reminder_day, target_date, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [goal.name, goal.targetAmount, goal.installmentAmount, goal.frequency, goal.reminderDay, goal.targetDate, userId]
  );
  return res.rows[0];
}

export async function updateGoal(db: Db, userId: string, id: number, goal: GoalFields) {
  const res = await db.query(
    `UPDATE savings_goals
     SET name = $1, target_amount = $2, installment_amount = $3, frequency = $4, reminder_day = $5, target_date = $6
     WHERE id = $7 AND user_id = $8
     RETURNING *`,
    [goal.name, goal.targetAmount, goal.installmentAmount, goal.frequency, goal.reminderDay, goal.targetDate, id, userId]
  );
  return res.rows[0] ?? null;
}

export async function findGoalNameForUpdate(db: Db, userId: string, id: number): Promise<string | null> {
  const res = await db.query("SELECT name FROM savings_goals WHERE id = $1 AND user_id = $2 FOR UPDATE", [id, userId]);
  return res.rows[0]?.name ?? null;
}

export async function goalExists(db: Db, userId: string, id: number): Promise<boolean> {
  const res = await db.query(`SELECT 1 FROM savings_goals WHERE id = $1 AND user_id = $2`, [id, userId]);
  return res.rows.length > 0;
}

export async function deleteGoal(db: Db, userId: string, id: number) {
  await db.query("DELETE FROM savings_goals WHERE id = $1 AND user_id = $2", [id, userId]);
}
