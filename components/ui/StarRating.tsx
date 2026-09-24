"use client";

import { useState } from "react";
import { formatRating } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const SIZE_CLASS = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
} as const;

function StarIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2.5l2.9 6.02 6.6.86-4.8 4.6 1.2 6.52L12 17.4l-5.9 3.1 1.2-6.52-4.8-4.6 6.6-.86L12 2.5z" />
    </svg>
  );
}

export function StarRating({
  value,
  onChange,
  size = "lg",
  disabled = false,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  size?: keyof typeof SIZE_CLASS;
  disabled?: boolean;
  className?: string;
}) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;

  return (
    <div
      className={cn(
        "flex items-center gap-1",
        className
      )}
      onMouseLeave={() => setHovered(0)}
      role="radiogroup"
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${
            star === 1 ? "" : "s"
          }`}
          disabled={disabled}
          onMouseEnter={() =>
            setHovered(star)
          }
          onClick={() =>
            onChange(
              value === star ? 0 : star
            )
          }
          className={cn(
            "rounded p-0.5 transition-transform",
            !disabled &&
              "hover:scale-110",
            disabled &&
              "cursor-not-allowed opacity-60"
          )}
        >
          <StarIcon
            className={cn(
              SIZE_CLASS[size],
              star <= shown
                ? "text-[#d9a400]"
                : "text-[var(--aurak-line-strong)]"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function StarRatingDisplay({
  average,
  count,
  size = "sm",
  showNumber = true,
  className,
}: {
  average: number;
  count?: number;
  size?: keyof typeof SIZE_CLASS;
  showNumber?: boolean;
  className?: string;
}) {
  const percent = Math.max(
    0,
    Math.min(100, (average / 5) * 100)
  );

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        className
      )}
    >
      <div
        className="relative inline-flex"
        aria-hidden
      >
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(
            (star) => (
              <StarIcon
                key={star}
                className={cn(
                  SIZE_CLASS[size],
                  "text-[var(--aurak-line-strong)]"
                )}
              />
            )
          )}
        </div>

        <div
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${percent}%` }}
        >
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(
              (star) => (
                <StarIcon
                  key={star}
                  className={cn(
                    SIZE_CLASS[size],
                    "text-[#d9a400]"
                  )}
                />
              )
            )}
          </div>
        </div>
      </div>

      {showNumber && (
        <span className="text-sm font-medium tabular text-[var(--aurak-navy)]">
          {formatRating(average)}
        </span>
      )}

      {typeof count === "number" && (
        <span className="text-xs text-[var(--aurak-text-muted)]">
          ({count})
        </span>
      )}

      <span className="sr-only">
        {formatRating(average)} out of 5
        {typeof count === "number"
          ? `, ${count} ratings`
          : ""}
      </span>
    </div>
  );
}