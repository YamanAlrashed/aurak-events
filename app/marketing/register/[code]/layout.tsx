import type { Metadata } from "next";
import { UNIVERSITY_NAME } from "@/lib/utils/constants";

/* =============================================================================
   PUBLIC registration shell.

   Deliberately outside every RoleGuard. Prospects are external people with no
   account, and are never treated as authenticated campus users. Mobile-browser
   first: a single narrow column, large touch targets, no app chrome.
   ========================================================================== */

export const metadata: Metadata = {
  title: "Event Registration",
  description: "Register for an AURAK recruitment event.",
};

export default function PublicRegistrationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--aurak-bg-subtle)]">
      <header className="border-b border-[var(--aurak-line)] bg-white">
        <div className="mx-auto w-full max-w-lg px-5 py-4">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-[var(--aurak-brand)]">
            AURAK
          </p>

          <p className="text-sm font-semibold text-[var(--aurak-navy)]">
            Event Registration
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-5 py-6">
        {children}
      </main>

      <footer className="safe-bottom border-t border-[var(--aurak-line)] bg-white">
        <div className="mx-auto w-full max-w-lg px-5 py-4">
          <p className="text-xs text-[var(--aurak-text-subtle)]">
            {UNIVERSITY_NAME}
          </p>

          <p className="mt-1 text-xs text-[var(--aurak-text-subtle)]">
            Prototype form — submissions are stored locally in this browser only.
          </p>
        </div>
      </footer>
    </div>
  );
}