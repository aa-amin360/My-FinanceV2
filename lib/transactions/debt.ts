export async function handleDebt({
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
  // DEBT_TAKEN
  // =========================
  if (type === "DEBT_TAKEN") {
    await client.query(
      `
      INSERT INTO debts (entity_id, total_amount, remaining_amount, user_id)
      VALUES ($1, $2, $2, $3)
      ON CONFLICT (entity_id, user_id)
      DO UPDATE SET
        total_amount = debts.total_amount + $2,
        remaining_amount = debts.remaining_amount + $2
      `,
      [entity_id, amountNumber, userId]
    );
  }

  // =========================
  // DEBT_REPAID
  // =========================
  if (type === "DEBT_REPAID") {
    const debtRes = await client.query(
      `SELECT * FROM debts WHERE entity_id = $1 AND user_id = $2`,
      [entity_id, userId]
    );

    const currentRemaining = Number(
      debtRes.rows[0]?.remaining_amount || 0
    );

    // 🔥 OVERPAY
    if (amountNumber > currentRemaining) {
      const repayAmount = currentRemaining;
      const extra = amountNumber - currentRemaining;

      if (repayAmount <= 0) {
        throw new Error("Nothing to repay");
      }

      const debtTaken = await client.query(
        `SELECT id FROM transactions
         WHERE entity_id = $1 AND type = 'DEBT_TAKEN' AND user_id = $2
         ORDER BY date DESC LIMIT 1`,
        [entity_id, userId]
      );

      if (debtTaken.rows.length === 0) {
        throw new Error("No DEBT_TAKEN found");
      }

      const parentDebtId = debtTaken.rows[0].id;

      const repayTx = await client.query(
        `INSERT INTO transactions
         (type, amount, from_account, to_account, entity_id, category_id, date, note, parent_id, user_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING id`,
        [
          "DEBT_REPAID",
          repayAmount,
          from_account,
          to_account,
          entity_id,
          category_id || null,
          date,
          note,
          parentDebtId,
          userId,
        ]
      );

      const parentId = repayTx.rows[0].id;

      // clear debt
      await client.query(
        `UPDATE debts
         SET total_amount = 0,
             remaining_amount = 0
         WHERE entity_id = $1 AND user_id = $2`,
        [entity_id, userId]
      );

      // extra → receivable
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

    // ✅ NORMAL REPAY
    await client.query(
      `INSERT INTO transactions
       (type, amount, from_account, to_account, entity_id, category_id, date, note, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        "DEBT_REPAID",
        amountNumber,
        from_account,
        to_account,
        entity_id,
        category_id || null,
        date,
        note,
        userId,
      ]
    );

    await client.query(
      `UPDATE debts
       SET remaining_amount = remaining_amount - $2
       WHERE entity_id = $1 AND user_id = $3`,
      [entity_id, amountNumber, userId]
    );

    await client.query(
      `DELETE FROM debts
       WHERE entity_id = $1 AND user_id = $2 AND remaining_amount <= 0`,
      [entity_id, userId]
    );
  }
}
