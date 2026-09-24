"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { ROLE_LABELS } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";

export function UserMenu({ className }: { className?: string }) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-[var(--aurak-bg-sunken)]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--aurak-brand-soft)] text-xs font-semibold text-[var(--aurak-brand)]">
          {user.initials}
        </span>

        <span className="hidden max-w-[10rem] truncate text-sm font-medium text-[var(--aurak-navy)] sm:block">
          {user.fullName}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-[var(--aurak-radius-lg)] border border-[var(--aurak-line)] bg-white shadow-[var(--aurak-shadow-lg)]"
        >
          <div className="border-b border-[var(--aurak-line)] px-4 py-3">
            <p className="truncate text-sm font-medium text-[var(--aurak-navy)]">
              {user.fullName}
            </p>

            <p className="truncate text-xs text-[var(--aurak-text-muted)]">
              {user.email}
            </p>

            <span className="badge badge-brand mt-2">
              {ROLE_LABELS[user.role]}
            </span>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-[var(--aurak-danger)] transition-colors hover:bg-[var(--aurak-danger-soft)]"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}