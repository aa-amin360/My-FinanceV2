import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    // 1. Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // 2. Check if user already exists
    const userCheck = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1",
      [cleanEmail]
    );

    if (userCheck.rows.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 } // Conflict
      );
    }

    // 3. Hash the password
    const passwordHash = hashPassword(password);

    // 4. Insert the new user into the database
    // id column is omitted to let Postgres automatically auto-generate its secure UUID
    await pool.query(
      `
      INSERT INTO users (email, name, password_hash)
      VALUES ($1, $2, $3)
      `,
      [cleanEmail, cleanName, passwordHash]
    );

    return NextResponse.json({
      success: true,
      message: "Account created successfully.",
    });

  } catch (err: any) {
    console.error("SIGNUP API ERROR:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}