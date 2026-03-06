"use client";

import Link from "next/link";
import LogoutButton from "./LogoutButton";
import AdminButton from "./AdminButton";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  backHref?: string;
  isAdmin?: boolean;
  impersonatingEmail?: string | null;
}

export default function Header({ title, subtitle, action, backHref, isAdmin: admin, impersonatingEmail }: HeaderProps) {
  return (
    <header className="bg-surface glass border-b border-border shadow-[var(--glass-shadow)]">
      <div className="px-4 max-w-lg mx-auto h-14 flex items-center">
        <div className="w-[4.5rem] flex-shrink-0 flex items-center gap-1">
          {backHref && (
            <Link
              href={backHref}
              className="w-8 h-8 rounded-full border border-border bg-surface-hover flex items-center justify-center text-muted hover:text-primary hover:border-primary/30 transition-colors"
              aria-label="Go back"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </Link>
          )}
          {admin && !backHref && <AdminButton impersonatingEmail={impersonatingEmail} />}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center min-w-0">
          <h1 className="text-base font-semibold tracking-tight truncate w-full">{title}</h1>
          {subtitle && <p className="text-xs text-muted truncate w-full">{subtitle}</p>}
          {action && <div className="mt-1">{action}</div>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Link
            href="/guide"
            className="w-8 h-8 rounded-full border border-border bg-surface-hover flex items-center justify-center text-muted hover:text-primary hover:border-primary/30 transition-colors"
            aria-label="Help & Guide"
            title="Help & Guide"
          >
            <span className="text-xs font-semibold">?</span>
          </Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
