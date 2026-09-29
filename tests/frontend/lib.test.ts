import { describe, expect, it } from "vitest";
import { dayKey, monthCells, monthRange } from "@/frontend/lib/calendar";
import { formatCompact, formatDbDate, transactionDisplayName } from "@/frontend/lib/format";
import { isGoalDueToday } from "@/frontend/lib/goals";
import { isActivePath } from "@/frontend/lib/navigation";
import { isOverdue } from "@/frontend/lib/plans";

describe("calendar helpers", () => {
  it("pads the first week so day 1 lands on its weekday", () => {
    // September 2026 starts on a Tuesday (index 2)
    const cells = monthCells(2026, 8);
    expect(cells.slice(0, 3)).toEqual([null, null, 1]);
    expect(cells.filter((c) => c !== null)).toHaveLength(30);
  });

  it("builds zero-padded day keys and month ranges", () => {
    expect(dayKey(2026, 0, 5)).toBe("2026-01-05");
    expect(monthRange(2024, 1)).toEqual({ startDate: "2024-02-01", endDate: "2024-02-29" });
  });
});

describe("format helpers", () => {
  it("formats stored dates in UTC so the calendar day never shifts", () => {
    expect(formatDbDate("2026-09-28")).toBe("Mon, Sep 28, 2026");
    expect(formatDbDate("2026-09-28", "short")).toBe("Sep 28");
  });

  it("compacts large amounts", () => {
    expect(formatCompact(950)).toBe("950");
    expect(formatCompact(1500)).toBe("1.5K");
    expect(formatCompact(2000)).toBe("2K");
    expect(formatCompact(250000)).toBe("250K");
  });

  it("names transactions by counterparty, then category, then type", () => {
    expect(transactionDisplayName({ type: "DEBT_TAKEN", entity_name: "karim hossain" })).toBe("Karim Hossain");
    expect(transactionDisplayName({ type: "EXPENSE", category_name: "groceries" })).toBe("Groceries");
    expect(transactionDisplayName({ type: "RECEIVABLE_RECEIVED" })).toBe("Receivable Received");
    expect(transactionDisplayName({ type: "RECEIVABLE_GIVEN", parent_id: 3 })).toBe("Overpaid → now receivable");
  });
});

describe("goal and plan helpers", () => {
  const monday28 = new Date(2026, 8, 28);

  it("knows when a goal installment is due", () => {
    expect(isGoalDueToday({ frequency: "MONTHLY", reminder_day: 28 }, monday28)).toBe(true);
    expect(isGoalDueToday({ frequency: "MONTHLY", reminder_day: 1 }, monday28)).toBe(false);
    expect(isGoalDueToday({ frequency: "WEEKLY", reminder_day: 1 }, monday28)).toBe(true);
    // Sunday is weekday 0 and must not be treated as "no reminder"
    expect(isGoalDueToday({ frequency: "WEEKLY", reminder_day: 0 }, new Date(2026, 8, 27))).toBe(true);
    expect(isGoalDueToday({ frequency: "DAILY", reminder_day: null }, monday28)).toBe(false);
  });

  it("flags only pending plans dated before today as overdue", () => {
    expect(isOverdue({ status: "PENDING", date: "2026-09-01" }, "2026-09-28")).toBe(true);
    expect(isOverdue({ status: "PENDING", date: "2026-09-28" }, "2026-09-28")).toBe(false);
    expect(isOverdue({ status: "CONFIRMED", date: "2026-09-01" }, "2026-09-28")).toBe(false);
  });
});

describe("navigation", () => {
  it("treats nested pages as part of their section", () => {
    expect(isActivePath("/debts/12", "/debts")).toBe(true);
    expect(isActivePath("/debts", "/debts")).toBe(true);
    expect(isActivePath("/debtsx", "/debts")).toBe(false);
  });
});
