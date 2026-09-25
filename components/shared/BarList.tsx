"use client";

import type { CountBucket } from "@/lib/types";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function BarList({
  buckets,
  total,
  emptyLabel = "No data yet.",
  maxRows,
  onSelect,
  selectedId,
  className,
}: {
  buckets: CountBucket[];
  total?: number;
  emptyLabel?: string;
  maxRows?: number;
  onSelect?: (bucket: CountBucket) => void;
  selectedId?: string;
  className?: string;
}) {
  const sorted = [...buckets].sort((a, b) => b.count - a.count);
  const rows = maxRows ? sorted.slice(0, maxRows) : sorted;
  const sum = total ?? buckets.reduce((acc, bucket) => acc + bucket.count, 0);
  const peak = Math.max(1, ...rows.map((bucket) => bucket.count));

  if (rows.length === 0 || sum === 0) {
    return <p className="meta-text">{emptyLabel}</p>;
  }

  return (
    <ul className={cn("space-y-2.5", className)}>
      {rows.map((bucket) => {
        const width = Math.max(2, (bucket.count / peak) * 100);
        const selected = selectedId === bucket.id;
        const interactive = Boolean(onSelect);

        const content = (
          <>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span
                className={cn(
                  "min-w-0 truncate text-sm",
                  selected
                    ? "font-medium text-[var(--aurak-brand)]"
                    : "text-[var(--aurak-text)]"
                )}
              >
                {bucket.label}
              </span>

              <span className="shrink-0 text-xs tabular text-[var(--aurak-text-muted)]">
                {formatNumber(bucket.count)}
                <span className="ml-1.5 text-[var(--aurak-text-subtle)]">
                  {formatPercent(bucket.count, sum)}
                </span>
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-[var(--aurak-bg-sunken)]">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  selected
                    ? "bg-[var(--aurak-brand)]"
                    : "bg-[var(--aurak-navy-soft)]"
                )}
                style={{ width: `${width}%` }}
              />
            </div>
          </>
        );

        return (
          <li key={bucket.id}>
            {interactive ? (
              <button
                type="button"
                onClick={() => onSelect?.(bucket)}
                aria-pressed={selected}
                className={cn(
                  "w-full rounded-[var(--aurak-radius)] px-2 py-1.5 text-left transition-colors",
                  selected
                    ? "bg-[var(--aurak-brand-soft)]"
                    : "hover:bg-[var(--aurak-bg-subtle)]"
                )}
              >
                {content}
              </button>
            ) : (
              <div className="px-2 py-1.5">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}