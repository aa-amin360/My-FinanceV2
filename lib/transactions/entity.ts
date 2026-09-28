import type { DbClient } from "@/lib/db";
import { TYPE_META, TxType } from "@/lib/transactions/types";

// Find or create a counterparty (person/bank). Names are stored lowercased.
export async function getEntityId(
  client: DbClient,
  name: string,
  type: "LIABILITY" | "ASSET",
  userId: string
): Promise<number> {
  const clean = name.trim().toLowerCase();

  const find = () =>
    client.query(
      `SELECT id FROM entities WHERE LOWER(name) = $1 AND user_id = $2 ORDER BY id LIMIT 1`,
      [clean, userId]
    );

  const existing = await find();
  if (existing.rows.length > 0) return existing.rows[0].id;

  const inserted = await client.query(
    `INSERT INTO entities (name, type, user_id)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [clean, type, userId]
  );
  if (inserted.rows.length > 0) return inserted.rows[0].id;

  return (await find()).rows[0].id;
}

export async function resolveEntity(
  client: DbClient,
  entity: string | null,
  type: TxType,
  userId: string
): Promise<number | null> {
  if (!entity) return null;

  const { group } = TYPE_META[type];
  if (group === "DEBT") return getEntityId(client, entity, "LIABILITY", userId);
  if (group === "RECEIVABLE") return getEntityId(client, entity, "ASSET", userId);
  return null;
}
