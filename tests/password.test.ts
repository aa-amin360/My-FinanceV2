import crypto from "crypto";
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password hashing", () => {
  it("hashes with a unique salt and verifies", async () => {
    const a = await hashPassword("correct horse");
    const b = await hashPassword("correct horse");

    expect(a).toMatch(/^pbkdf2_sha512\$210000\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    expect(a).not.toBe(b);
    expect(await verifyPassword("correct horse", a)).toEqual({ valid: true, needsRehash: false });
    expect((await verifyPassword("wrong", a)).valid).toBe(false);
  });

  it("verifies legacy salt:hash values and flags them for rehash", async () => {
    const salt = "abcdef0123456789abcdef0123456789";
    const hash = crypto.pbkdf2Sync("old-password", salt, 1000, 64, "sha512").toString("hex");
    const legacy = `${salt}:${hash}`;

    expect(await verifyPassword("old-password", legacy)).toEqual({ valid: true, needsRehash: true });
    expect(await verifyPassword("nope", legacy)).toEqual({ valid: false, needsRehash: false });
  });

  it("rejects malformed stored values", async () => {
    expect((await verifyPassword("x", "garbage")).valid).toBe(false);
    expect((await verifyPassword("x", "pbkdf2_sha512$abc$$")).valid).toBe(false);
  });
});
