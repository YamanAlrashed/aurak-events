"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--aurak-text-subtle)]"
        aria-hidden
      />

      <input
        type="search"
        className="input pl-9 pr-9"
        placeholder={placeholder}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--aurak-text-subtle)] transition-colors hover:bg-[var(--aurak-bg-sunken)] hover:text-[var(--aurak-navy)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}