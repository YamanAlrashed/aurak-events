"use client";

import { useMemo } from "react";
import { Info } from "lucide-react";
import type {
  CampusUserType,
  TargetAudience,
} from "@/lib/types";
import {
  MultiSelect,
  type MultiSelectGroup,
} from "@/components/ui/MultiSelect";
import {
  CAMPUS_USER_TYPE_OPTIONS,
  COLLEGES,
} from "@/lib/data/campus-reference";
import { countAudience } from "@/lib/services/notificationService";
import {
  describeTargetAudience,
  formatNumber,
} from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const SELECTABLE_SCHOOL_IDS = [
  "college-engineering",
  "college-business",
  "college-arts-sciences",
] as const;

export function TargetAudiencePicker({
  value,
  onChange,
  error,
}: {
  value: TargetAudience;
  onChange: (audience: TargetAudience) => void;
  error?: string;
}) {
  const schoolGroups: MultiSelectGroup[] = useMemo(
    () => [
      {
        id: "academic-schools",
        label: "Academic Schools",
        options: COLLEGES.filter((college) =>
          SELECTABLE_SCHOOL_IDS.includes(
            college.id as (typeof SELECTABLE_SCHOOL_IDS)[number]
          )
        ).map((college) => ({
          value: college.id,
          label: college.name,
        })),
      },
    ],
    []
  );

  const recipientCount = useMemo(
    () => countAudience(value),
    [value]
  );

  function toggleUserType(type: CampusUserType) {
    const next = value.userTypes.includes(type)
      ? value.userTypes.filter((item) => item !== type)
      : [...value.userTypes, type];

    onChange({
      ...value,
      userTypes: next,
    });
  }

  return (
    <div className="space-y-5">
      <div className="alert alert-info">
        <Info
          className="mt-0.5 h-4 w-4 shrink-0"
          aria-hidden
        />

        <span>
          Target audience controls{" "}
          <strong>
            who receives the notification
          </strong>
          . Every published event stays visible to all
          internal AURAK users.
        </span>
      </div>

      <div>
        <p className={cn("label label-required mb-2")}>
          Who should be notified
        </p>

        <div className="flex flex-wrap gap-2">
          {CAMPUS_USER_TYPE_OPTIONS.map((option) => {
            const selected =
              value.userTypes.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  toggleUserType(option.value)
                }
                aria-pressed={selected}
                className={cn(
                  "btn btn-sm",
                  selected
                    ? "btn-primary"
                    : "btn-secondary"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="field-error">{error}</p>
        )}
      </div>

      <div>
        <p className="label">Academic Schools</p>

        <p className="field-hint mb-2 mt-0">
          Select one or more schools. Leave empty to
          notify all selected user types.
        </p>

        <MultiSelect
          groups={schoolGroups}
          selected={value.collegeIds.filter((id) =>
            SELECTABLE_SCHOOL_IDS.includes(
              id as (typeof SELECTABLE_SCHOOL_IDS)[number]
            )
          )}
          onChange={(collegeIds) =>
            onChange({
              ...value,
              collegeIds,
              departmentIds: [],
              programIds: [],
            })
          }
          searchable={false}
          emptyLabel="All academic schools."
          maxHeightClass="max-h-48"
        />
      </div>

      <div className="rounded-[var(--aurak-radius)] border border-[var(--aurak-brand-border)] bg-[var(--aurak-brand-soft)] px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-[0.04em] text-[var(--aurak-brand)]">
          Notification will reach
        </p>

        <p className="mt-1 text-sm font-medium text-[var(--aurak-navy)]">
          {describeTargetAudience(value)}
        </p>

        <p className="mt-1 text-xs text-[var(--aurak-text-muted)]">
          Approximately{" "}
          <span className="tabular font-medium text-[var(--aurak-navy)]">
            {formatNumber(recipientCount)}
          </span>{" "}
          people in the directory. Everyone else can
          still see the event.
        </p>
      </div>
    </div>
  );
}