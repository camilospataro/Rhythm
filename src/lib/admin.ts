import { createClient } from "@/lib/supabase/server";
import { isDevBypass } from "@/lib/dev";

/**
 * Checks if the current authenticated user is an admin.
 * Admin is determined by matching email against ADMIN_EMAIL env var.
 */
export async function isAdmin(): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;

  if (isDevBypass()) return true;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;

  return user.email.toLowerCase() === adminEmail.toLowerCase();
}
