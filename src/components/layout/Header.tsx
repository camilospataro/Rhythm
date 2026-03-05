"use client";

import Link from "next/link";
import LogoutButton from "./LogoutButton";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <header className="bg-surface glass border-b border-border shadow-[var(--glass-shadow)]">
      <div className="relative px-4 max-w-lg mx-auto text-center h-14 flex items-center justify-center">
        <div className="absolute left-4">
          <LogoutButton />
        </div>
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-base font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
          {action && <div className="mt-1">{action}</div>}
        </div>
        <Link
          href="/guide"
          className="absolute right-4 w-7 h-7 rounded-full border border-border bg-surface-hover flex items-center justify-center text-muted hover:text-primary hover:border-primary/30 transition-colors"
          title="Help & Guide"
        >
          <span className="text-xs font-semibold">?</span>
        </Link>
      </div>
    </header>
  );
}
