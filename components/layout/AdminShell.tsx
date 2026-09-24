"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { isNavItemActive, type NavItem } from "@/lib/config/navigation";
import { UserMenu } from "@/components/layout/UserMenu";
import { cn } from "@/lib/utils/cn";

export function AdminShell({
  moduleLabel,
  navItems,
  children,
}: {
  moduleLabel: string;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-dvh">
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-[rgba(18,36,63,0.35)] lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[var(--aurak-sidenav-w)] flex-col border-r border-[var(--aurak-line)] bg-white transition-transform duration-200",
          "lg:static lg:z-auto lg:translate-x-0",
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-[var(--aurak-topbar-h)] shrink-0 items-center justify-between border-b border-[var(--aurak-line)] px-4">
          <Link href="/" className="min-w-0">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[var(--aurak-brand)]">
              AURAK
            </p>

            <p className="truncate text-sm font-semibold text-[var(--aurak-navy)]">
              {moduleLabel}
            </p>
          </Link>

          <button
            type="button"
            className="btn btn-ghost btn-sm lg:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const active = isNavItemActive(item, pathname);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "nav-item",
                  active && "nav-item-active"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--aurak-line)] p-3">
          <p className="text-[0.6875rem] leading-relaxed text-[var(--aurak-text-subtle)]">
            Prototype build. Mock data only.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[var(--aurak-topbar-h)] shrink-0 items-center justify-between gap-3 border-b border-[var(--aurak-line)] bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="btn btn-ghost btn-sm lg:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1 lg:hidden">
            <p className="truncate text-sm font-semibold text-[var(--aurak-navy)]">
              {moduleLabel}
            </p>
          </div>

          <div className="ml-auto">
            <UserMenu />
          </div>
        </header>

        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}