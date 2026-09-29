import type { Db } from "@/backend/db/pool";

export type EntityType = "LIABILITY" | "ASSET";

async function findEntityId(db: Db, cleanName: string, userId: string): Promise<number | null> {
  const res = await db.query(
    `SELECT id FROM entities WHERE LOWER(name) = $1 AND user_id = $2 ORDER BY id LIMIT 1`,
    [cleanName, userId]
  );
  return res.rows[0]?.id ?? null;
}

// Find or create a counterparty (person/bank). Names are stored lowercased.
export async function getEntityId(db: Db, name: string, type: EntityType, userId: string): Promise<number> {
  const clean = name.trim().toLowerCase();

  const existing = await findEntityId(db, clean, userId);
  if (existing !== null) return existing;

  const inserted = await db.query(
    `INSERT INTO entities (name, type, user_id)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [clean, type, userId]
  );
  if (inserted.rows.length > 0) return inserted.rows[0].id;

  return (await findEntityId(db, clean, userId)) as number;
}
