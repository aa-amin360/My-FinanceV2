import { api } from "@/frontend/api/client";

export const authApi = {
  signUp: (input: { name: string; email: string; password: string }) => api.post("/api/auth/signup", input),
  onboardingStatus: () =>
    api.get<{ history_initialized: boolean }>("/api/auth/onboarding").then((res) => res.history_initialized),
  completeOnboarding: () => api.post("/api/auth/onboarding"),
};
