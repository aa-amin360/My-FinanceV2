import { describe, expect, it } from "vitest";
import { AppError } from "@/backend/http/AppError";
import { buildFlow } from "@/backend/services/transactions/flow";

describe("buildFlow", () => {
  const ids = { accountId: 1, savingsId: 2, debtId: 3, receivableId: 4 };

  it("routes each type between the right accounts", () => {
    expect(buildFlow("INCOME", null, ids, null)).toEqual({ from_account: null, to_account: 1 });
    expect(buildFlow("EXPENSE", null, ids, null)).toEqual({ from_account: 1, to_account: null });
    expect(buildFlow("TRANSFER", "TO_SAVINGS", ids, null)).toEqual({ from_account: 1, to_account: 2 });
    expect(buildFlow("TRANSFER", "FROM_SAVINGS", ids, null)).toEqual({ from_account: 2, to_account: 1 });
    expect(buildFlow("DEBT_TAKEN", null, ids, 9)).toEqual({ from_account: 3, to_account: 1 });
    expect(buildFlow("DEBT_REPAID", null, ids, 9)).toEqual({ from_account: 1, to_account: 3 });
    expect(buildFlow("RECEIVABLE_GIVEN", null, ids, 9)).toEqual({ from_account: 1, to_account: 4 });
    expect(buildFlow("RECEIVABLE_RECEIVED", null, ids, 9)).toEqual({ from_account: 4, to_account: 1 });
  });

  it("requires a counterparty for debts and receivables", () => {
    expect(() => buildFlow("DEBT_TAKEN", null, ids, null)).toThrow(AppError);
  });

  it("requires a direction for transfers", () => {
    expect(() => buildFlow("TRANSFER", null, ids, null)).toThrow(AppError);
  });
});
