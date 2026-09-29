import type { Db } from "@/backend/db/pool";
import { AppError } from "@/backend/http/AppError";
import { lockAccount } from "@/backend/repositories/accounts";
import { getAccountBalance } from "@/backend/repositories/transactions";
import { TYPE_META, TxType } from "@/shared/transactionTypes";

// Reject outflows larger than the source account's balance.
// Must run inside a database transaction so the row lock holds until commit.
export async function assertSufficientBalance(db: Db, accountId: number, userId: string, type: TxType, amount: number) {
  const flowType = TYPE_META[type].flow;
  if (flowType !== "OUT" && flowType !== "MOVE") return;

  await lockAccount(db, accountId, userId);

  const balance = await getAccountBalance(db, accountId, userId);
  if (amount > balance) {
    throw new AppError("Insufficient balance in source account.");
  }
}
