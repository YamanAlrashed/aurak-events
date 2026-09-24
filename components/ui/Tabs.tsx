"use client";

import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export function Tabs({
  items,
  activeId,
  onChange,
  className,
}: {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "scroll-x no-scrollbar flex gap-5 border-b border-[var(--aurak-line)]",
        className
      )}
    >
      {items.map((item) => {
        const active = item.id === activeId;

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn("tab", active && "tab-active")}
          >
            {item.label}

            {typeof item.count === "number" && (
              <span
                className={cn(
                  "ml-1.5 tabular",
                  active
                    ? "text-[var(--aurak-brand)]"
                    : "text-[var(--aurak-text-subtle)]"
                )}
              >
                {formatNumber(item.count)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}