import crypto from "crypto";
import { promisify } from "util";

const pbkdf2 = promisify(crypto.pbkdf2);

// OWASP recommendation for PBKDF2-HMAC-SHA512
const ITERATIONS = 210_000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";
const PREFIX = "pbkdf2_sha512";

// Hashes created before the upgrade were stored as "salt:hash" with 1,000 iterations
const LEGACY_ITERATIONS = 1000;

async function derive(password: string, salt: string, iterations: number) {
  return pbkdf2(password, salt, iterations, KEY_LENGTH, DIGEST);
}

function safeEqualHex(expectedHex: string, actual: Buffer) {
  const expected = Buffer.from(expectedHex, "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

// Stored format: pbkdf2_sha512$<iterations>$<salt>$<hash>
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await derive(password, salt, ITERATIONS);
  return `${PREFIX}$${ITERATIONS}$${salt}$${hash.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedValue: string
): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (storedValue.startsWith(`${PREFIX}$`)) {
    const [, iterationsStr, salt, hash] = storedValue.split("$");
    const iterations = Number(iterationsStr);
    if (!salt || !hash || !Number.isInteger(iterations) || iterations <= 0) {
      return { valid: false, needsRehash: false };
    }
    const valid = safeEqualHex(hash, await derive(password, salt, iterations));
    return { valid, needsRehash: valid && iterations < ITERATIONS };
  }

  const parts = storedValue.split(":");
  if (parts.length !== 2) return { valid: false, needsRehash: false };

  const [salt, hash] = parts;
  const valid = safeEqualHex(hash, await derive(password, salt, LEGACY_ITERATIONS));
  return { valid, needsRehash: valid };
}
