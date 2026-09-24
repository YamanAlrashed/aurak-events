"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { isNavItemActive, type NavItem } from "@/lib/config/navigation";
import { UserMenu } from "@/components/layout/UserMenu";
import { cn } from "@/lib/utils/cn";

export function MobileShell({
  moduleLabel,
  tabs,
  showBackButton = false,
  children,
}: {
  moduleLabel: string;
  tabs?: NavItem[];
  showBackButton?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const hasTabs = Boolean(tabs?.length);

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--aurak-bg-subtle)]">
      <header className="sticky top-0 z-30 flex h-[var(--aurak-topbar-h)] shrink-0 items-center gap-2 border-b border-[var(--aurak-line)] bg-white/95 px-3 backdrop-blur sm:px-5">
        {showBackButton && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <Link href="/" className="min-w-0 flex-1">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-[var(--aurak-brand)]">
            AURAK
          </p>

          <p className="truncate text-sm font-semibold text-[var(--aurak-navy)]">
            {moduleLabel}
          </p>
        </Link>

        <UserMenu />
      </header>

      <main
        className={cn(
          "min-w-0 flex-1",
          hasTabs && "pb-[calc(var(--aurak-tabbar-h)+1rem)]"
        )}
      >
        {children}
      </main>

      {hasTabs && (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 flex h-[var(--aurak-tabbar-h)] items-stretch border-t border-[var(--aurak-line)] bg-white">
          {tabs!.map((tab) => {
            const active = isNavItemActive(tab, pathname);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "tabbar-item",
                  active && "tabbar-item-active"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}