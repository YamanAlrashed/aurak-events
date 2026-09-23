"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { getHomeRoute } from "@/lib/services/authService";
import { MOCK_ACCOUNTS } from "@/lib/data/mock-accounts";
import {
  APP_NAME,
  MOCK_PASSWORD,
  ROLE_LABELS,
  UNIVERSITY_NAME,
} from "@/lib/utils/constants";

export default function LoginPage() {
  const router = useRouter();
  const { user, isRestoring, signIn, signOut } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your university email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);

    const result = await signIn({
      email,
      password,
    });

    if (!result.ok) {
      setError(result.message);
      setIsSubmitting(false);
      return;
    }

    router.push(result.redirectTo);
  }

  function useDemoAccount(demoEmail: string) {
    setEmail(demoEmail);
    setPassword(MOCK_PASSWORD);
    setError(null);
  }

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="hidden bg-[var(--aurak-brand)] px-12 py-16 text-white lg:flex lg:w-[42%] lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
            AURAK
          </p>

          <h1 className="mt-6 max-w-sm text-3xl font-semibold leading-tight text-white">
            Events &amp; Marketing Platform
          </h1>

          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80">
            One place to run campus events for students, staff and faculty, and
            to manage recruitment events for prospective students.
          </p>
        </div>

        <div className="space-y-4">
          <div className="h-px w-16 bg-white/25" />

          <div className="space-y-2 text-sm text-white/75">
            <p>
              Campus Events — RSVP, QR check-in, galleries and ratings.
            </p>

            <p>
              Marketing — registrations, visitors and recruitment analytics.
            </p>
          </div>

          <p className="pt-4 text-xs text-white/55">
            {UNIVERSITY_NAME}
          </p>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--aurak-brand)]">
              AURAK
            </p>

            <h1 className="mt-1 text-xl font-semibold text-[var(--aurak-navy)]">
              {APP_NAME}
            </h1>
          </div>

          {isRestoring ? (
            <div className="card card-pad space-y-3">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-full" />
            </div>
          ) : user ? (
            <div className="card card-pad">
              <h2 className="section-title">
                Already signed in
              </h2>

              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--aurak-brand-soft)] text-sm font-semibold text-[var(--aurak-brand)]">
                  {user.initials}
                </span>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--aurak-navy)]">
                    {user.fullName}
                  </p>

                  <p className="truncate text-xs text-[var(--aurak-text-muted)]">
                    {ROLE_LABELS[user.role]}
                  </p>
                </div>
              </div>

              <p className="meta-text mt-3 truncate">
                {user.email}
              </p>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  className="btn btn-primary flex-1"
                  onClick={() => router.push(getHomeRoute(user))}
                >
                  Continue
                </button>

                <button
                  className="btn btn-secondary flex-1"
                  onClick={signOut}
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 hidden lg:block">
                <h2 className="text-xl font-semibold text-[var(--aurak-navy)]">
                  Sign in
                </h2>

                <p className="page-subtitle">
                  Use your AURAK university account.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                noValidate
                className="space-y-4"
              >
                <div>
                  <label htmlFor="email" className="label">
                    University Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="input"
                    placeholder="name@aurak.ac.ae"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="label">
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className="input"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                {error && (
                  <div className="alert alert-error" role="alert">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-block btn-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing in…" : "Sign In"}
                </button>
              </form>

              <div className="mt-6">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm w-full justify-between"
                  onClick={() => setShowDemoAccounts((value) => !value)}
                  aria-expanded={showDemoAccounts}
                >
                  <span>Demo accounts</span>
                  <span aria-hidden>
                    {showDemoAccounts ? "−" : "+"}
                  </span>
                </button>

                {showDemoAccounts && (
                  <ul className="mt-2 divide-y divide-[var(--aurak-line)] overflow-hidden rounded-[var(--aurak-radius)] border border-[var(--aurak-line)] bg-white">
                    {MOCK_ACCOUNTS.map((account) => (
                      <li
                        key={account.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-[var(--aurak-navy)]">
                            {ROLE_LABELS[account.role]}
                          </p>

                          <p className="truncate text-xs text-[var(--aurak-text-muted)]">
                            {account.email}
                          </p>
                        </div>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm shrink-0"
                          onClick={() => useDemoAccount(account.email)}
                        >
                          Use
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="mt-6 text-xs leading-relaxed text-[var(--aurak-text-subtle)]">
                Prototype sign-in. Not connected to AURAK SSO or EUMS, and not
                secure — for demonstration only.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}