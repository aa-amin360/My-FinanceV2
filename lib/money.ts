// Money arrives from Postgres NUMERIC columns as strings. Summing them as
// floats accumulates rounding errors (0.1 + 0.2), so work in integer cents.

export function toCents(value: number | string | null | undefined): number {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? Math.round(num * 100) : 0;
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function sumMoney(values: Array<number | string | null | undefined>): number {
  return fromCents(values.reduce<number>((total, value) => total + toCents(value), 0));
}

export function subtractMoney(a: number | string, b: number | string): number {
  return fromCents(toCents(a) - toCents(b));
}
