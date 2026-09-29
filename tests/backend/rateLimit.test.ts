import { describe, expect, it } from "vitest";
import { clientIp, rateLimit } from "@/backend/auth/rateLimit";

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
