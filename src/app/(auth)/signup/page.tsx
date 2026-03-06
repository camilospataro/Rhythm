"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/guide");
      router.refresh();
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <Image src="/logo.png" alt="Rhythm" width={140} height={45} className="h-10 w-auto mx-auto dark:invert" priority />
        <p className="text-muted mt-3 text-sm">Create your account</p>
      </div>

      <div className="bg-surface glass rounded-2xl border border-border shadow-[var(--glass-shadow-lg)] p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger/10 text-danger text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-hover border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-hover border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
              placeholder="At least 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-b from-primary to-primary-dark text-white font-medium shadow-[0_2px_12px_rgba(124,91,240,0.35)] hover:shadow-[0_4px_20px_rgba(124,91,240,0.45)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-muted mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:text-primary-light transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
