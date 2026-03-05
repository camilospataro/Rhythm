import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const bypassAuth = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

  if (bypassAuth) {
    redirect("/day");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/day");
  } else {
    redirect("/login");
  }
}
