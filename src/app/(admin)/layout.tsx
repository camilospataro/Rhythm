import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await isAdmin();
  if (!admin) redirect("/day");

  return (
    <div className="min-h-screen">
      <header className="bg-surface glass border-b border-border shadow-[var(--glass-shadow)]">
        <div className="px-4 max-w-4xl mx-auto h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-base font-semibold tracking-tight">
              Admin Panel
            </Link>
            <nav className="flex items-center gap-2">
              <Link
                href="/admin"
                className="text-sm text-muted hover:text-foreground transition-colors"
              >
                Users
              </Link>
            </nav>
          </div>
          <Link
            href="/day"
            className="text-sm text-muted hover:text-primary transition-colors"
          >
            Back to App
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
