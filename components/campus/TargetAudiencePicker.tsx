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
  departmentOptions,
  getCollege,
  programOptions,
} from "@/lib/data/campus-reference";
import { countAudience } from "@/lib/services/notificationService";
import {
  describeTargetAudience,
  formatNumber,
} from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function TargetAudiencePicker({
  value,
  onChange,
  error,
}: {
  value: TargetAudience;
  onChange: (audience: TargetAudience) => void;
  error?: string;
}) {
  const departmentGroups: MultiSelectGroup[] = useMemo(() => {
    const options = departmentOptions(value.collegeIds);

    if (value.collegeIds.length === 0) {
      return [
        {
          id: "all",
          label: "All departments",
          options,
        },
      ];
    }

    return value.collegeIds.map((collegeId) => ({
      id: collegeId,
      label: getCollege(collegeId)?.shortName ?? "College",
      options: options.filter(
        (option) =>
          option.description === getCollege(collegeId)?.shortName
      ),
    }));
  }, [value.collegeIds]);

  const programGroups: MultiSelectGroup[] = useMemo(
    () => [
      {
        id: "programs",
        label:
          value.departmentIds.length > 0
            ? "Programs in selected departments"
            : "All programs",
        options: programOptions(value.departmentIds),
      },
    ],
    [value.departmentIds]
  );

  const collegeGroups: MultiSelectGroup[] = useMemo(
    () => [
      {
        id: "colleges",
        label: "Colleges",
        options: COLLEGES.map((college) => ({
          value: college.id,
          label: college.shortName,
          description: college.name,
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
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          Target audience controls{" "}
          <strong>who receives the notification</strong>. Every published
          event stays visible to all internal AURAK users.
        </span>
      </div>

      <div>
        <p className={cn("label label-required mb-2")}>
          Who should be notified
        </p>

        <div className="flex flex-wrap gap-2">
          {CAMPUS_USER_TYPE_OPTIONS.map((option) => {
            const selected = value.userTypes.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleUserType(option.value)}
                aria-pressed={selected}
                className={cn(
                  "btn btn-sm",
                  selected ? "btn-primary" : "btn-secondary"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {error && <p className="field-error">{error}</p>}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div>
          <p className="label">Colleges</p>
          <p className="field-hint mb-2 mt-0">
            Leave empty to notify all colleges.
          </p>

          <MultiSelect
            groups={collegeGroups}
            selected={value.collegeIds}
            onChange={(collegeIds) =>
              onChange({
                ...value,
                collegeIds,
                departmentIds: [],
                programIds: [],
              })
            }
            searchable={false}
            emptyLabel="All colleges."
            maxHeightClass="max-h-48"
          />
        </div>

        <div>
          <p className="label">Departments</p>
          <p className="field-hint mb-2 mt-0">
            Leave empty to notify all departments.
          </p>

          <MultiSelect
            groups={departmentGroups}
            selected={value.departmentIds}
            onChange={(departmentIds) =>
              onChange({
                ...value,
                departmentIds,
                programIds: [],
              })
            }
            searchPlaceholder="Search departments…"
            emptyLabel="All departments."
            maxHeightClass="max-h-48"
          />
        </div>

        <div>
          <p className="label">Programs</p>
          <p className="field-hint mb-2 mt-0">
            Leave empty to notify all programs.
          </p>

          <MultiSelect
            groups={programGroups}
            selected={value.programIds}
            onChange={(programIds) =>
              onChange({
                ...value,
                programIds,
              })
            }
            searchPlaceholder="Search programs…"
            emptyLabel="All programs."
            maxHeightClass="max-h-48"
          />
        </div>
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
          people in the directory. Everyone else can still see the event.
        </p>
      </div>
    </div>
  );
}