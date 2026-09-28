import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { AppError, errorResponse, readJson } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { clientIp, rateLimit, tooManyAttemptsMessage } from "@/lib/rateLimit";
import { parseRequiredText } from "@/lib/validation";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const limit = rateLimit(`signup:ip:${clientIp(req.headers)}`, 5, 60 * 60 * 1000);
    if (!limit.ok) {
      throw new AppError(tooManyAttemptsMessage(limit.retryAfterSeconds), 429);
    }

    const body = await readJson(req);
    const name = parseRequiredText(body.name, "Name", 100);
    const email = parseRequiredText(body.email, "Email", 255).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";

    if (!EMAIL_PATTERN.test(email)) {
      throw new AppError("Please enter a valid email address.");
    }
    if (password.length < 8) {
      throw new AppError("Password must be at least 8 characters long.");
    }
    if (password.length > 200) {
      throw new AppError("Password is too long.");
    }

    const passwordHash = await hashPassword(password);

    // The UNIQUE constraint on email makes this safe against concurrent sign-ups
    const inserted = await pool.query(
      `
      INSERT INTO users (email, name, password_hash)
      SELECT $1::text, $2::text, $3::text
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = $1::text)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
      `,
      [email, name, passwordHash]
    );

    if (inserted.rows.length === 0) {
      throw new AppError("An account with this email already exists.", 409);
    }

    return NextResponse.json({ success: true, message: "Account created successfully." });
  } catch (err) {
    return errorResponse(err, "SIGNUP API ERROR");
  }
}
