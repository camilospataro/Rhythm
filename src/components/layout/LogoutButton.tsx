"use client";

import { useTransition } from "react";
import { logout } from "@/actions/auth";

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => logout())}
      disabled={isPending}
      className="w-8 h-8 flex items-center justify-center text-muted hover:text-danger transition-colors disabled:opacity-50"
      aria-label="Sign out"
      title="Sign out"
    >
      {isPending ? (
        <div className="w-4.5 h-4.5 border-2 border-muted/30 border-t-muted rounded-full animate-spin" />
      ) : (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
        </svg>
      )}
    </button>
  );
}
