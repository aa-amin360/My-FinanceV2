import { describe, expect, it } from "vitest";
import { subtractMoney, sumMoney, toCents } from "@/shared/money";

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
