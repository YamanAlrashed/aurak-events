"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  size = "md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const widthClass = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-lg",
    lg: "sm:max-w-2xl",
  }[size];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-[rgba(18,36,63,0.45)]"
        onClick={onClose}
        aria-hidden
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden bg-white shadow-[var(--aurak-shadow-lg)]",
          "rounded-t-[var(--aurak-radius-xl)] sm:rounded-[var(--aurak-radius-xl)]",
          widthClass
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--aurak-line)] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[var(--aurak-navy)]">
              {title}
            </h2>

            {description && (
              <p className="mt-0.5 text-sm text-[var(--aurak-text-muted)]">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn btn-ghost btn-sm shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {children && (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {children}
          </div>
        )}

        {footer && (
          <div className="safe-bottom shrink-0 border-t border-[var(--aurak-line)] bg-[var(--aurak-bg-subtle)] px-5 py-3">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {footer}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}