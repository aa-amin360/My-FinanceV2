import { AppError } from "@/backend/http/AppError";

export type JsonBody = Record<string, unknown>;

// Parse a JSON object body, rejecting anything else with a 400
export async function readJson(req: Request): Promise<JsonBody> {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Body must be an object");
    }
    return body as JsonBody;
  } catch {
    throw new AppError("Invalid request body.");
  }
}

export function searchParams(req: Request) {
  return new URL(req.url).searchParams;
}
