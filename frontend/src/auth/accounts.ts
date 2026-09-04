/**
 * The frontend authenticates as a single predefined user, configured via
 * VITE_AUTH_TOKEN in .env. This is NOT a real login system — per the
 * assignment, auth is a fixed bearer token. To demo a different
 * role/user, edit VITE_AUTH_TOKEN in frontend/.env (matching one of the
 * backend's USER_TOKEN / USER2_TOKEN / ADMIN_TOKEN values) and restart
 * `pnpm dev`.
 */
export function getActiveToken(): string | null {
  return import.meta.env.VITE_AUTH_TOKEN || null;
}
