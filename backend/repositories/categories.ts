import type { Db } from "@/backend/db/pool";

// The user's categories plus shared defaults, each with the all-time total of
// the user's transactions in that category
export async function listCategoriesWithTotals(db: Db, userId: string) {
  const res = await db.query(
    `
    SELECT c.id, c.name, c.type, COALESCE(SUM(t.amount), 0) AS total
    FROM categories c
    LEFT JOIN transactions t
      ON t.category_id = c.id
      AND t.user_id = $1
      AND t.type = c.type
    WHERE c.user_id = $1 OR c.user_id IS NULL
    GROUP BY c.id
    ORDER BY c.name ASC
    `,
    [userId]
  );
  return res.rows;
}

// Insert unless a category with the same name and type already exists. Returns null on duplicate.
export async function insertCategoryIfNew(db: Db, userId: string, name: string, type: string) {
  const res = await db.query(
    `
    INSERT INTO categories (name, type, user_id)
    SELECT $1::text, $2::text, $3::uuid
    WHERE NOT EXISTS (
      SELECT 1 FROM categories
      WHERE (user_id = $3::uuid OR user_id IS NULL)
        AND LOWER(name) = LOWER($1::text)
        AND type = $2::text
    )
    RETURNING id, name, type
    `,
    [name, type, userId]
  );
  return res.rows[0] ?? null;
}

// Category type if the category is visible to the user, otherwise null
export async function findCategoryType(db: Db, userId: string, categoryId: number): Promise<string | null> {
  const res = await db.query(
    `SELECT type FROM categories WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`,
    [categoryId, userId]
  );
  return res.rows[0]?.type ?? null;
}
