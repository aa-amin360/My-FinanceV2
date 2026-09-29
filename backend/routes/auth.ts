import NextAuth from "next-auth";
import { authOptions } from "@/backend/auth/authOptions";
import { clientIp, rateLimit, tooManyAttemptsMessage } from "@/backend/auth/rateLimit";
import { AppError } from "@/backend/http/AppError";
import { readJson } from "@/backend/http/request";
import { ok, route } from "@/backend/http/response";
import { requireUserId } from "@/backend/http/session";
import { signUp } from "@/backend/services/auth";
import { completeOnboarding, getOnboardingStatus } from "@/backend/services/onboarding";
import { parseSignup } from "@/backend/validators/auth";

// /api/auth/[...nextauth]
export const nextAuthHandler = NextAuth(authOptions);

// POST /api/auth/signup
export const postSignup = route("SIGNUP API ERROR", async (req) => {
  const limit = rateLimit(`signup:ip:${clientIp(req.headers)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    throw new AppError(tooManyAttemptsMessage(limit.retryAfterSeconds), 429);
  }

  await signUp(parseSignup(await readJson(req)));
  return ok({ message: "Account created successfully." });
});

// GET /api/auth/onboarding
export const getOnboarding = route("GET ONBOARDING STATUS ERROR", async () => {
  const userId = await requireUserId();
  return ok({ history_initialized: await getOnboardingStatus(userId) });
});

// POST /api/auth/onboarding
export const postOnboarding = route("POST ONBOARDING STATUS ERROR", async () => {
  const userId = await requireUserId();
  await completeOnboarding(userId);
  return ok({ message: "Onboarding successfully completed." });
});
