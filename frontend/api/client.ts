import { requestFinished, requestStarted } from "@/frontend/lib/activity";

// Minimal typed wrapper around fetch for the app's own /api routes.
// Every endpoint answers { success: true, ...data } or { error: "message" }.

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

function withQuery(path: string, query?: Query) {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

async function request<T>(method: string, path: string, { query, body }: { query?: Query; body?: unknown } = {}) {
  let res: Response;
  let data: any;
  requestStarted();
  try {
    try {
      res = await fetch(withQuery(path, query), {
        method,
        cache: "no-store",
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError("Network error. Please check your connection.", 0);
    }
    data = await res.json().catch(() => ({}));
  } finally {
    requestFinished();
  }

  if (!res.ok) {
    throw new ApiError(data.error || "Something went wrong. Please try again.", res.status);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>("GET", path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body }),
  delete: <T>(path: string, query?: Query) => request<T>("DELETE", path, { query }),
};

// Readable message for any error thrown by the client (or anything else)
export function errorMessage(err: unknown, fallback = "Something went wrong. Please try again.") {
  return err instanceof Error && err.message ? err.message : fallback;
}
