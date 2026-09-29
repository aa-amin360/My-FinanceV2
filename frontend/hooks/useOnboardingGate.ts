"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/frontend/api/auth";
import { isOnboardingCached, setOnboardingCached } from "@/frontend/lib/onboardingCache";

// Send users who haven't finished onboarding to /onboarding.
// Once confirmed, the result is cached for the tab so navigation stays fast.
export function useOnboardingGate(pathname: string) {
  const router = useRouter();

  useEffect(() => {
    if (isOnboardingCached()) return;

    authApi
      .onboardingStatus()
      .then((onboarded) => {
        if (onboarded) setOnboardingCached(true);
        else router.push("/onboarding");
      })
      .catch((err) => console.error("Onboarding gate check failed:", err));
  }, [pathname, router]);
}
