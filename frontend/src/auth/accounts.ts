/**
 * The frontend authenticates as a single predefined user via a bearer
 * token. There is no signup and no real session — per the assignment, auth
 * is just a predefined per-user token. The sign-in page lets you paste that
 * token in instead of editing an env var; it's stored in localStorage and
 * attached to every API request (see api/client.ts).
 */
const ACTIVE_TOKEN_KEY = "calorie-tracker.active-token";

export function getActiveToken(): string | null {
  return localStorage.getItem(ACTIVE_TOKEN_KEY);
}

export function setActiveToken(token: string): void {
  localStorage.setItem(ACTIVE_TOKEN_KEY, token);
}

export function clearActiveToken(): void {
  localStorage.removeItem(ACTIVE_TOKEN_KEY);
}
