import { NextResponse } from "next/server";
import { AppError } from "@/backend/http/AppError";

// Successful JSON response in the shape every endpoint uses: { success: true, ...data }
export function ok(data: Record<string, unknown> = {}) {
  return NextResponse.json({ success: true, ...data });
}

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

type RouteContext = { params: Record<string, string> };
type Handler = (req: Request, ctx: RouteContext) => Promise<Response>;

// Wrap a route handler so any thrown error becomes a proper JSON error response
export function route(context: string, handler: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      return errorResponse(err, context);
    }
  };
}
