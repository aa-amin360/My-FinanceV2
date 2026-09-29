import { AppError } from "@/backend/http/AppError";
import type { JsonBody } from "@/backend/http/request";
import { parseRequiredText } from "@/backend/validators/common";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseSignup(body: JsonBody) {
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

  return { name, email, password };
}
