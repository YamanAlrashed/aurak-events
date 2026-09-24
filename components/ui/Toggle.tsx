"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4",
        className
      )}
    >
      <div className="min-w-0">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-[var(--aurak-navy)]"
        >
          {label}
        </label>

        {description && (
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--aurak-text-muted)]">
            {description}
          </p>
        )}
      </div>

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked
            ? "bg-[var(--aurak-brand)]"
            : "bg-[var(--aurak-line-strong)]",
          disabled && "cursor-not-allowed opacity-55"
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow-[var(--aurak-shadow-xs)] transition-transform",
            checked
              ? "translate-x-[1.375rem]"
              : "translate-x-0.5"
          )}
        />

        <span className="sr-only">
          {checked ? "On" : "Off"}
        </span>
      </button>
    </div>
  );
}
