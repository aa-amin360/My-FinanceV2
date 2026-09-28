import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { subtractMoney, sumMoney, toCents } from "@/lib/money";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { buildFlow } from "@/lib/transactions/flow";

describe("money helpers", () => {
  it("sums without floating point drift", () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(sumMoney([0.1, 0.2])).toBe(0.3);
    expect(sumMoney(["19.99", "0.01", null, undefined])).toBe(20);
  });

  it("subtracts exactly", () => {
    expect(subtractMoney("100.10", "0.20")).toBe(99.9);
    expect(toCents("abc")).toBe(0);
  });
});

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

describe("rateLimit", () => {
  it("allows up to the limit within the window", () => {
    const key = `test:${Math.random()}`;
    expect(rateLimit(key, 2, 60_000).ok).toBe(true);
    expect(rateLimit(key, 2, 60_000).ok).toBe(true);
    const blocked = rateLimit(key, 2, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("reads the first forwarded address", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientIp({ "x-real-ip": "5.6.7.8" })).toBe("5.6.7.8");
    expect(clientIp(undefined)).toBe("unknown");
  });
});
