import { AppError } from "@/lib/errors";

const MAX_AMOUNT = 1_000_000_000_000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isBlank(value: unknown) {
  return value === undefined || value === null || value === "";
}

// Positive money amount rounded to 2 decimals
export function parseAmount(value: unknown, field = "Amount"): number {
  const num = typeof value === "string" ? Number(value.trim()) : Number(value);

  if (isBlank(value) || !Number.isFinite(num) || num <= 0) {
    throw new AppError(`${field} must be a number greater than 0.`);
  }
  if (num > MAX_AMOUNT) {
    throw new AppError(`${field} is too large.`);
  }

  return Math.round(num * 100) / 100;
}

export function parseOptionalAmount(value: unknown, field = "Amount"): number | null {
  return isBlank(value) ? null : parseAmount(value, field);
}

// Non-negative amount, used for opening balances where 0 means "none"
export function parseNonNegativeAmount(value: unknown, field = "Amount"): number {
  if (isBlank(value)) return 0;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new AppError(`${field} cannot be negative.`);
  }
  if (num > MAX_AMOUNT) {
    throw new AppError(`${field} is too large.`);
  }
  return Math.round(num * 100) / 100;
}

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseDate(value: unknown, field = "Date"): string {
  if (!isValidDateString(value)) {
    throw new AppError(`${field} must be a valid date (YYYY-MM-DD).`);
  }
  return value;
}

export function parseOptionalDate(value: unknown, field = "Date"): string | null {
  return isBlank(value) ? null : parseDate(value, field);
}

// Use the client-supplied local date when valid, otherwise the server's UTC date
export function dateOrToday(value: unknown): string {
  return isValidDateString(value) ? value : new Date().toISOString().slice(0, 10);
}

export function parseEnum<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new AppError(`${field} must be one of: ${allowed.join(", ")}.`);
  }
  return value as T;
}

export function parseText(
  value: unknown,
  field: string,
  { max = 255, required = true }: { max?: number; required?: boolean } = {}
): string | null {
  if (isBlank(value)) {
    if (required) throw new AppError(`${field} is required.`);
    return null;
  }
  if (typeof value !== "string") {
    throw new AppError(`${field} must be text.`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    if (required) throw new AppError(`${field} is required.`);
    return null;
  }
  if (trimmed.length > max) {
    throw new AppError(`${field} must be at most ${max} characters.`);
  }
  return trimmed;
}

export function parseRequiredText(value: unknown, field: string, max = 255): string {
  return parseText(value, field, { max, required: true }) as string;
}

export function parseId(value: unknown, field = "ID"): number {
  const num = typeof value === "string" ? Number(value.trim()) : Number(value);
  if (!Number.isInteger(num) || num <= 0 || num > 2_147_483_647) {
    throw new AppError(`${field} is invalid.`);
  }
  return num;
}

export function parseOptionalId(value: unknown, field = "ID"): number | null {
  return isBlank(value) ? null : parseId(value, field);
}

export function parseInteger(value: unknown, field: string, min: number, max: number): number {
  const num = Number(value);
  if (isBlank(value) || !Number.isInteger(num) || num < min || num > max) {
    throw new AppError(`${field} must be a whole number between ${min} and ${max}.`);
  }
  return num;
}
