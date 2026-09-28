// Remembers for the browser tab that the signed-in user has finished onboarding,
// so the dashboard layout doesn't re-check the server on every navigation.
// Cleared on sign-out and when the ledger is reset.

const KEY = "onboarding-complete";

export function isOnboardingCached(): boolean {
  try {
    return sessionStorage.getItem(KEY) === "true";
  } catch {
    return false;
  }
}

export function setOnboardingCached(done: boolean) {
  try {
    if (done) sessionStorage.setItem(KEY, "true");
    else sessionStorage.removeItem(KEY);
  } catch {
    // storage unavailable (private mode etc.) - fall back to checking every time
  }
}
