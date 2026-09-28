import { AppError } from "@/lib/errors";
import type { AccountIds } from "@/lib/transactions/accounts";
import type { TransferDirection, TxType } from "@/lib/transactions/types";

export type Flow = { from_account: number | null; to_account: number | null };

// Decide which accounts money moves between for a transaction type
export function buildFlow(
  type: TxType,
  direction: TransferDirection | null,
  ids: AccountIds,
  entityId: number | null
): Flow {
  const { accountId, savingsId, debtId, receivableId } = ids;
  const needsEntity = () => {
    if (!entityId) throw new AppError("Enter the person or counterparty.");
  };

  switch (type) {
    case "INCOME":
      return { from_account: null, to_account: accountId };

    case "EXPENSE":
      return { from_account: accountId, to_account: null };

    case "TRANSFER":
      if (!direction) throw new AppError("Transfer direction is required.");
      return direction === "TO_SAVINGS"
        ? { from_account: accountId, to_account: savingsId }
        : { from_account: savingsId, to_account: accountId };

    case "DEBT_TAKEN":
      needsEntity();
      return { from_account: debtId, to_account: accountId };

    case "DEBT_REPAID":
      needsEntity();
      return { from_account: accountId, to_account: debtId };

    case "RECEIVABLE_GIVEN":
      needsEntity();
      return { from_account: accountId, to_account: receivableId };

    case "RECEIVABLE_RECEIVED":
      needsEntity();
      return { from_account: receivableId, to_account: accountId };

    default:
      throw new AppError("Invalid transaction type.");
  }
}
