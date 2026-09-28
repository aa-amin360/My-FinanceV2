import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import {
  dateOrToday,
  isValidDateString,
  parseAmount,
  parseEnum,
  parseId,
  parseInteger,
  parseNonNegativeAmount,
  parseText,
} from "@/lib/validation";

describe("parseAmount", () => {
  it("accepts positive numbers and numeric strings, rounding to cents", () => {
    expect(parseAmount(10)).toBe(10);
    expect(parseAmount("12.345")).toBe(12.35);
  });

  it.each([0, -5, "abc", "", null, undefined, Infinity, NaN])("rejects %s", (value) => {
    expect(() => parseAmount(value)).toThrow(AppError);
  });

  it("rejects absurdly large amounts", () => {
    expect(() => parseAmount(1e15)).toThrow(/too large/);
  });
});

describe("parseNonNegativeAmount", () => {
  it("treats blank as zero and rejects negatives", () => {
    expect(parseNonNegativeAmount(undefined)).toBe(0);
    expect(parseNonNegativeAmount("0")).toBe(0);
    expect(() => parseNonNegativeAmount(-1)).toThrow(AppError);
  });
});

describe("dates", () => {
  it("validates real calendar dates", () => {
    expect(isValidDateString("2026-02-28")).toBe(true);
    expect(isValidDateString("2026-02-30")).toBe(false);
    expect(isValidDateString("2026/02/01")).toBe(false);
    expect(isValidDateString(20260201)).toBe(false);
  });

  it("falls back to today for invalid client dates", () => {
    expect(dateOrToday("2026-01-15")).toBe("2026-01-15");
    expect(dateOrToday("nope")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("other parsers", () => {
  it("parseEnum only accepts listed values", () => {
    expect(parseEnum("Cash", ["Cash", "Bank"] as const, "Account")).toBe("Cash");
    expect(() => parseEnum("Debt", ["Cash", "Bank"] as const, "Account")).toThrow(AppError);
  });

  it("parseId requires positive integers", () => {
    expect(parseId("42")).toBe(42);
    expect(() => parseId("4.2")).toThrow(AppError);
    expect(() => parseId("-1")).toThrow(AppError);
    expect(() => parseId("1; DROP TABLE users")).toThrow(AppError);
  });

  it("parseText trims and enforces length", () => {
    expect(parseText("  hi  ", "Note")).toBe("hi");
    expect(parseText("", "Note", { required: false })).toBeNull();
    expect(() => parseText("x".repeat(11), "Note", { max: 10 })).toThrow(/at most 10/);
    expect(() => parseText(123, "Note")).toThrow(AppError);
  });

  it("parseInteger enforces bounds", () => {
    expect(parseInteger("6", "Day", 0, 6)).toBe(6);
    expect(() => parseInteger("7", "Day", 0, 6)).toThrow(AppError);
  });
});
