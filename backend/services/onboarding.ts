import pool from "@/backend/db/pool";
import { getOnboardingState, setHistoryInitialized } from "@/backend/repositories/users";

// Users who already have transactions are treated as onboarded permanently
export async function getOnboardingStatus(userId: string): Promise<boolean> {
  const { historyInitialized, hasTransactions } = await getOnboardingState(pool, userId);

  if (!historyInitialized && hasTransactions) {
    await setHistoryInitialized(pool, userId, true);
    return true;
  }
  return historyInitialized;
}

export async function completeOnboarding(userId: string) {
  await setHistoryInitialized(pool, userId, true);
}
