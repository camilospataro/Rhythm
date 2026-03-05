// Fixed dev user ID used when NEXT_PUBLIC_DEV_BYPASS_AUTH=true
// This must match a user in Supabase auth.users for RLS to work.
// We'll create this user automatically on first use.
export const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";
export const DEV_USER_EMAIL = "dev@rhythm.local";

export function isDevBypass(): boolean {
  return process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";
}
