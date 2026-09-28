import { describe, expect, it } from "vitest";
import { formatTypeLabel, isInflowType, isLedgerRow, isSplitParent, isUserLinkedChild } from "@/lib/ledger";

describe("isUserLinkedChild", () => {
  it("treats repayments under the original obligation as user entries", () => {
    expect(isUserLinkedChild("DEBT_REPAID", "DEBT_TAKEN")).toBe(true);
    expect(isUserLinkedChild("RECEIVABLE_RECEIVED", "RECEIVABLE_GIVEN")).toBe(true);
  });

  it("treats the settlement half of an overpayment split as automatic", () => {
    expect(isUserLinkedChild("DEBT_REPAID", "DEBT_REPAID")).toBe(false);
    expect(isUserLinkedChild("RECEIVABLE_RECEIVED", "RECEIVABLE_RECEIVED")).toBe(false);
  });

  it("treats the converted remainder of an overpayment as automatic", () => {
    expect(isUserLinkedChild("RECEIVABLE_GIVEN", "DEBT_REPAID")).toBe(false);
    expect(isUserLinkedChild("DEBT_TAKEN", "RECEIVABLE_RECEIVED")).toBe(false);
  });

  it("treats repayments of a converted remainder as user entries", () => {
    // Overpaid a debt -> receivable created under a DEBT_REPAID split parent;
    // later collecting that receivable links to the same parent.
    expect(isUserLinkedChild("RECEIVABLE_RECEIVED", "DEBT_REPAID")).toBe(true);
    expect(isUserLinkedChild("DEBT_REPAID", "RECEIVABLE_RECEIVED")).toBe(true);
  });
});

describe("isSplitParent / isLedgerRow", () => {
  it("excludes settlement parents that have children", () => {
    const row = { type: "DEBT_REPAID", parent_id: null, has_child: true };
    expect(isSplitParent(row)).toBe(true);
    expect(isLedgerRow(row)).toBe(false);
  });

  it("keeps origin transactions even when they have repayments", () => {
    expect(isLedgerRow({ type: "DEBT_TAKEN", parent_id: null, has_child: true })).toBe(true);
  });

  it("keeps children and childless rows", () => {
    expect(isLedgerRow({ type: "DEBT_REPAID", parent_id: 5, has_child: false })).toBe(true);
    expect(isLedgerRow({ type: "RECEIVABLE_RECEIVED", parent_id: null, has_child: false })).toBe(true);
  });
});

describe("formatting helpers", () => {
  it("formats every underscore in a type", () => {
    expect(formatTypeLabel("RECEIVABLE_RECEIVED")).toBe("Receivable Received");
    expect(formatTypeLabel("DEBT_TAKEN")).toBe("Debt Taken");
  });

  it("classifies inflows", () => {
    expect(isInflowType("INCOME")).toBe(true);
    expect(isInflowType("DEBT_TAKEN")).toBe(true);
    expect(isInflowType("EXPENSE")).toBe(false);
    expect(isInflowType("TRANSFER")).toBe(false);
  });
});
