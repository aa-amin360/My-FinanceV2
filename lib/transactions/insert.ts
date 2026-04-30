export async function insertTransaction(client: any, payload: any) {
  return client.query(
    `INSERT INTO transactions 
     (type, amount, from_account, to_account, entity_id, category_id, date, note, user_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    payload
  );
}
