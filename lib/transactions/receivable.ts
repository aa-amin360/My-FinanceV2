export async function handleReceivable({
  client,
  type,
  entity_id,
  amountNumber,
  from_account,
  to_account,
  category_id,
  date,
  note,
  userId,
  receivableId,
}: any) {
  if (!entity_id) return;

  // =========================
  // RECEIVABLE_GIVEN
  // =========================
  if (type === "RECEIVABLE_GIVEN") {
    await client.query(
      `
      INSERT INTO receivables (entity_id, total_amount, remaining_amount, user_id)
      VALUES ($1, $2, $2, $3)
      ON CONFLICT (entity_id, user_id)
      DO UPDATE SET
        total_amount = receivables.total_amount + $2,
        remaining_amount = receivables.remaining_amount + $2
      `,
      [entity_id, amountNumber, userId]
    );
  }

  // =========================
  // RECEIVABLE_RECEIVED
  // =========================
  if (type === "RECEIVABLE_RECEIVED") {
    const recRes = await client.query(
      `SELECT * FROM receivables WHERE entity_id = $1 AND user_id = $2`,
      [entity_id, userId]
    );

    const currentRemaining = Number(
      recRes.rows[0]?.remaining_amount || 0
    );

    // 🔥 OVER RECEIVE
    if (amountNumber > currentRemaining) {
      const receiveAmount = currentRemaining;
      const extra = amountNumber - currentRemaining;

      if (receiveAmount <= 0) {
        throw new Error("Nothing to receive");
      }

      const receiveTx = await client.query(
        `INSERT INTO transactions
         (type, amount, from_account, to_account, entity_id, category_id, date, note, user_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING id`,
        [
          "RECEIVABLE_RECEIVED",
          receiveAmount,
          from_account,
          to_account,
          entity_id,
          category_id || null,
          date,
          note,
          userId,
        ]
      );

      const parentId = receiveTx.rows[0].id;

      await client.query(
        `UPDATE receivables
         SET total_amount = 0,
             remaining_amount = 0
         WHERE entity_id = $1 AND user_id = $2`,
        [entity_id, userId]
      );

      if (extra > 0) {
        await client.query(
          `INSERT INTO receivables (entity_id, total_amount, remaining_amount, user_id)
           VALUES ($1, $2, $2, $3)
           ON CONFLICT (entity_id, user_id)
           DO UPDATE SET
             total_amount = receivables.total_amount + $2,
             remaining_amount = receivables.remaining_amount + $2`,
          [entity_id, extra, userId]
        );

        await client.query(
          `INSERT INTO transactions
           (type, amount, from_account, to_account, entity_id, date, note, parent_id, user_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            "RECEIVABLE_GIVEN",
            extra,
            from_account,
            receivableId,
            entity_id,
            date,
            "Auto conversion",
            parentId,
            userId,
          ]
        );
      }

      return "COMMIT_EARLY";
    }

    // =========================
    // ✅ NORMAL RECEIVE (STRUCTURED)
    // =========================
    
    // 1. CREATE PARENT
    const parentTx = await client.query(
      `INSERT INTO transactions
       (type, amount, from_account, to_account, entity_id, category_id, date, note, parent_id, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
      [
        "RECEIVABLE_RECEIVED",
        amountNumber,
        from_account,
        to_account,
        entity_id,
        category_id || null,
        date,
        note,
        null,
        userId,
      ]
    );
    
    const parentId = parentTx.rows[0].id;
    
    // 2. CHILD → ACTUAL RECEIVE
    await client.query(
      `INSERT INTO transactions
       (type, amount, from_account, to_account, entity_id, category_id, date, note, parent_id, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        "RECEIVABLE_RECEIVED",
        amountNumber,
        from_account,
        to_account,
        entity_id,
        category_id || null,
        date,
        note,
        parentId,
        userId,
      ]
    );
    
    // 3. UPDATE RECEIVABLE
    await client.query(
      `UPDATE receivables
       SET remaining_amount = remaining_amount - $2
       WHERE entity_id = $1 AND user_id = $3`,
      [entity_id, amountNumber, userId]
    );
    
    await client.query(
      `DELETE FROM receivables
       WHERE entity_id = $1 AND user_id = $2 AND remaining_amount <= 0`,
      [entity_id, userId]
    );
    
    return "COMMIT_EARLY";
    
  }
}
