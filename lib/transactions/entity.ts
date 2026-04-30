export async function getEntityId(client: any, name: string, type: string, userId: string) {
  const clean = name.trim().toLowerCase();

  const res = await client.query(
    `SELECT id FROM entities WHERE LOWER(name) = $1 AND user_id = $2 LIMIT 1`,
    [clean, userId]
  );

  if (res.rows.length > 0) return res.rows[0].id;

  const insert = await client.query(
    `INSERT INTO entities (name, type, user_id)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [clean, type, userId]
  );

  return insert.rows[0].id;
}

export async function resolveEntity(client: any, entity: string, type: string, userId: string, TYPE_META: any) {
  if (!entity) return null;

  const meta = TYPE_META[type];

  if (meta.group === "DEBT") {
    return getEntityId(client, entity, "LIABILITY", userId);
  }

  if (meta.group === "RECEIVABLE") {
    return getEntityId(client, entity, "ASSET", userId);
  }

  return null;
}
