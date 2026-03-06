import { cookies } from "next/headers";
import { getImpersonatedUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Checks if the current session has admin mode activated.
 * Admin mode is activated by entering the correct password on the Guide page,
 * which sets an `admin_session` cookie.
 */
export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "true";
}

/**
 * Returns admin info for passing to client components.
 * Returns null if not admin, otherwise includes impersonation state.
 */
export async function getAdminInfo(): Promise<{
  isAdmin: true;
  impersonatingEmail: string | null;
} | null> {
  const admin = await isAdmin();
  if (!admin) return null;

  const impersonatedId = await getImpersonatedUserId();
  let impersonatingEmail: string | null = null;

  if (impersonatedId) {
    try {
      const adminClient = createAdminClient();
      const { data } = await adminClient.auth.admin.getUserById(impersonatedId);
      impersonatingEmail = data?.user?.email || impersonatedId.slice(0, 8);
    } catch {
      impersonatingEmail = impersonatedId.slice(0, 8);
    }
  }

  return { isAdmin: true, impersonatingEmail };
}
