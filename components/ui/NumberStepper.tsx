"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 20,
  quickPicks,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  quickPicks?: number[];
  className?: string;
}) {
  const clamp = (next: number) =>
    Math.min(max, Math.max(min, next));

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-center gap-4 rounded-[var(--aurak-radius-lg)] border border-[var(--aurak-line)] bg-white p-3">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= min}
          aria-label="Decrease"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--aurak-line-strong)] text-[var(--aurak-navy)] transition-colors hover:bg-[var(--aurak-bg-subtle)] disabled:opacity-40"
        >
          <Minus className="h-5 w-5" />
        </button>

        <span
          className="min-w-[3rem] text-center text-3xl font-semibold tabular text-[var(--aurak-navy)]"
          aria-live="polite"
        >
          {value}
        </span>

        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= max}
          aria-label="Increase"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--aurak-line-strong)] text-[var(--aurak-navy)] transition-colors hover:bg-[var(--aurak-bg-subtle)] disabled:opacity-40"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {quickPicks && quickPicks.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {quickPicks.map((pick) => (
            <button
              key={pick}
              type="button"
              onClick={() => onChange(clamp(pick))}
              className={cn(
                "btn btn-sm",
                value === pick
                  ? "btn-primary"
                  : "btn-secondary"
              )}
            >
              {pick}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}