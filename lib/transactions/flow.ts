export function buildFlow(type: string, direction: string, ids: any, entity_id: string | null) {
  let from_account = null;
  let to_account = null;

  const { accountId, savingsId, debtId, receivableId } = ids;

  switch (type) {
    case "INCOME":
      to_account = accountId;
      break;

    case "EXPENSE":
      from_account = accountId;
      break;

    case "TRANSFER":
      if (!direction) throw new Error("Direction required");

      if (direction === "TO_SAVINGS") {
        from_account = accountId;
        to_account = savingsId;
      } else {
        from_account = savingsId;
        to_account = accountId;
      }
      break;

    case "DEBT_TAKEN":
      if (!entity_id) throw new Error("Entity required");
      from_account = debtId;
      to_account = accountId;
      break;

    case "DEBT_REPAID":
      if (!entity_id) throw new Error("Entity required");
      from_account = accountId;
      to_account = debtId;
      break;

    case "RECEIVABLE_GIVEN":
      if (!entity_id) throw new Error("Entity required");
      from_account = accountId;
      to_account = receivableId;
      break;

    case "RECEIVABLE_RECEIVED":
      if (!entity_id) throw new Error("Entity required");
      from_account = receivableId;
      to_account = accountId;
      break;

    default:
      throw new Error("Invalid type");
  }

  return { from_account, to_account };
}
