"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import type { Option } from "@/lib/types";
import { SearchInput } from "@/components/ui/SearchInput";
import { cn } from "@/lib/utils/cn";

export interface MultiSelectGroup {
  id: string;
  label: string;
  options: Option[];
}

export function MultiSelect({
  groups,
  selected,
  onChange,
  searchable = true,
  searchPlaceholder = "Search…",
  emptyLabel = "Nothing selected yet.",
  maxHeightClass = "max-h-72",
  className,
}: {
  groups: MultiSelectGroup[];
  selected: string[];
  onChange: (values: string[]) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyLabel?: string;
  maxHeightClass?: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");

  const labelByValue = useMemo(() => {
    const map = new Map<string, string>();

    groups.forEach((group) =>
      group.options.forEach((option) =>
        map.set(option.value, option.label)
      )
    );

    return map;
  }, [groups]);

  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) return groups;

    return groups
      .map((group) => ({
        ...group,
        options: group.options.filter(
          (option) =>
            option.label.toLowerCase().includes(needle) ||
            option.description?.toLowerCase().includes(needle)
        ),
      }))
      .filter((group) => group.options.length > 0);
  }, [groups, query]);

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  }

  function toggleGroup(group: MultiSelectGroup) {
    const values = group.options.map((o) => o.value);

    const allSelected = values.every((v) =>
      selected.includes(v)
    );

    onChange(
      allSelected
        ? selected.filter((v) => !values.includes(v))
        : Array.from(new Set([...selected, ...values]))
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="rounded-[var(--aurak-radius)] border border-[var(--aurak-line)] bg-[var(--aurak-bg-subtle)] p-2.5">
        {selected.length === 0 ? (
          <p className="px-1 py-0.5 text-xs text-[var(--aurak-text-subtle)]">
            {emptyLabel}
          </p>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-medium text-[var(--aurak-navy)]">
                {selected.length} selected
              </span>

              <button
                type="button"
                className="text-xs font-medium text-[var(--aurak-brand)] hover:underline"
                onClick={() => onChange([])}
              >
                Clear all
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {selected.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--aurak-brand-border)] bg-white py-1 pl-2.5 pr-1 text-xs font-medium text-[var(--aurak-brand)]"
                >
                  {labelByValue.get(value) ?? value}

                  <button
                    type="button"
                    onClick={() => toggle(value)}
                    aria-label={`Remove ${
                      labelByValue.get(value) ?? value
                    }`}
                    className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-[var(--aurak-brand-soft)]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {searchable && (
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={searchPlaceholder}
        />
      )}

      <div
        className={cn(
          "overflow-y-auto rounded-[var(--aurak-radius)] border border-[var(--aurak-line)] bg-white",
          maxHeightClass
        )}
      >
        {filteredGroups.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-[var(--aurak-text-muted)]">
            No matches.
          </p>
        ) : (
          filteredGroups.map((group) => {
            const values = group.options.map((o) => o.value);

            const allSelected = values.every((v) =>
              selected.includes(v)
            );

            const someSelected =
              !allSelected &&
              values.some((v) => selected.includes(v));

            return (
              <div
                key={group.id}
                className="border-b border-[var(--aurak-line)] last:border-b-0"
              >
                <div className="sticky top-0 flex items-center justify-between gap-2 border-b border-[var(--aurak-line)] bg-[var(--aurak-bg-subtle)] px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--aurak-text-muted)]">
                    {group.label}

                    {someSelected && (
                      <span className="ml-1.5 font-medium normal-case tracking-normal text-[var(--aurak-brand)]">
                        {
                          values.filter((v) =>
                            selected.includes(v)
                          ).length
                        }{" "}
                        of {values.length}
                      </span>
                    )}
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleGroup(group)}
                    className="text-xs font-medium text-[var(--aurak-brand)] hover:underline"
                  >
                    {allSelected
                      ? "Deselect all"
                      : "Select all"}
                  </button>
                </div>

                <ul>
                  {group.options.map((option) => {
                    const isSelected =
                      selected.includes(option.value);

                    return (
                      <li key={option.value}>
                        <button
                          type="button"
                          onClick={() =>
                            toggle(option.value)
                          }
                          aria-pressed={isSelected}
                          className={cn(
                            "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                            isSelected
                              ? "bg-[var(--aurak-brand-soft)]"
                              : "hover:bg-[var(--aurak-bg-subtle)]"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border",
                              isSelected
                                ? "border-[var(--aurak-brand)] bg-[var(--aurak-brand)] text-white"
                                : "border-[var(--aurak-line-strong)] bg-white"
                            )}
                            aria-hidden
                          >
                            {isSelected && (
                              <Check className="h-3 w-3" />
                            )}
                          </span>

                          <span className="min-w-0">
                            <span
                              className={cn(
                                "block truncate text-sm",
                                isSelected
                                  ? "font-medium text-[var(--aurak-brand)]"
                                  : "text-[var(--aurak-text)]"
                              )}
                            >
                              {option.label}
                            </span>

                            {option.description && (
                              <span className="block truncate text-xs text-[var(--aurak-text-muted)]">
                                {option.description}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}