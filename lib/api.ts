import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppError } from "@/lib/errors";

export { AppError };

// Convert any thrown value into a JSON response. Only AppError messages reach
// the client; everything else is logged and replaced with a generic message.
export function errorResponse(err: unknown, context: string) {
  if (err instanceof AppError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }

  console.error(`${context}:`, err);
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 }
  );
}

// Resolve the signed-in user's database UUID or throw a 401
export async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  return userId;
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Body must be an object");
    }
    return body as Record<string, unknown>;
  } catch {
    throw new AppError("Invalid request body.");
  }
}
